// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { v4 as uuid } from 'uuid';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate ( context: vscode.ExtensionContext ) {

	const logChannel = vscode.window.createOutputChannel( 'Angular Nouns' );

	logChannel.appendLine( 'Extension enabled' );
	logChannel.appendLine( vscode.Uri.name );
	logChannel.show();

	// We will be able to use uuid in form of nonce
	logChannel.appendLine( uuid() );

	// This is how to show notification
	// vscode.window.showInformationMessage( 'Extension enabled' );

	const provider = new NounViewProvider( context.extensionUri, logChannel );

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider( NounViewProvider.viewType, provider )
	);

	context.subscriptions.push(
		vscode.commands.registerCommand( 'ng-nouns.addColor', () => {
			provider.addColor();
		} )
	);


	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand( 'ng-nouns-companion.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage( 'Hello World from Angular Nouns Companion!' );
	// } );
	// context.subscriptions.push( disposable );

	// const suhDisposable = vscode.commands.registerCommand( 'ng-nouns-companion.startUpHappened', () => {
	// 	console.log( 'Startup happened function is now initiated' );
	// 	vscode.window.showInformationMessage( 'NG-Nouns Started!' );
	// } );
	// context.subscriptions.push( suhDisposable );
}

class NounViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'ngnouns.nounView';

	private _view?: vscode.WebviewView;

	constructor( private readonly _extensionUri: vscode.Uri, private logChannel: vscode.OutputChannel ) {
		this.logChannel.appendLine( 'Constructor is run' );
	}

	public resolveWebviewView (
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext<unknown>,
		token: vscode.CancellationToken ): void | Thenable<void> {
		this._view = webviewView;

		this._view.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview( webviewView.webview );

		webviewView.webview.onDidReceiveMessage( data => {

			switch ( data.type ) {
				case 'colorSelected':
					{
						// vscode.window.activeTextEditor?.insertSnippet( new vscode.SnippetString( `#${ data.value }` ) );
						this.logChannel.appendLine( 'colorSelected happened' );
						break;
					}
			}
		} );
	}

	public addColor = () => {
		if ( this._view ) {
			this._view.show?.( true );
			this._view.webview.postMessage( { type: 'addColor' } );
		}
	};

	private _getHtmlForWebview = ( webview: vscode.Webview ) => {

		this.logChannel.appendLine( 'view is called' );

		const scriptUri = webview.asWebviewUri( vscode.Uri.joinPath( this._extensionUri, 'media', 'main.js' ) );

		const styleResetUri = webview.asWebviewUri( vscode.Uri.joinPath( this._extensionUri, 'media', 'reset.css' ) );

		const nonce = uuid();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->

				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${ webview.cspSource }; script-src 'nonce-${ nonce }';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<!-- <link href="${ styleResetUri }" rel="stylesheet"> -->
				
				<title>Angular Nouns</title>
			</head>
			<body>
				<ul class="color-list"></ul>

				<button class="add-color-button">Add Color</button>

				<script nonce="${ nonce }" src="${ scriptUri }"></script>
			</body>
			</html>`;
	};
}

// this method is called when your extension is deactivated
export function deactivate () { }
