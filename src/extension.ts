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

	const authenticator = new Authenticator( context.secrets );

	const provider = new NounViewProvider( context.extensionUri, logChannel, authenticator );

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider( NounViewProvider.viewType, provider )
	);



	// context.subscriptions.push(
	// 	vscode.commands.registerCommand( 'ng-nouns.setTNPSecret', async () => {
	// 		await authenticator.addSecret();
	// 	} )
	// );

	const settingsWatcher = vscode.workspace.createFileSystemWatcher( '**/*.json' );

	settingsWatcher.onDidChange( uri => {
		logChannel.appendLine( JSON.stringify( uri ) );
	} );
	settingsWatcher.onDidCreate( uri => { } ); // listen to files/folders being created
	settingsWatcher.onDidDelete( uri => { } ); // listen to files/folders getting deleted

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

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private logChannel: vscode.OutputChannel,
		private authenticator: Authenticator,
	) {
		this.logChannel.appendLine( 'Constructor is run on view provider' );

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

		webviewView.webview.onDidReceiveMessage( async ( data ) => {

			switch ( data.type ) {
				case 'initiate': {
					this.credentialExistence();
					break;
				}
				case 'logAppend': {
					this.logChannel.appendLine( '>>>' + data.log );
					break;
				}
				case 'clearCredentials': {
					try {
						this.logChannel.appendLine( 'Credential clear requested' );
						this.logChannel.appendLine( JSON.stringify( await this.authenticator.getCredentials() ) );
						this.logChannel.appendLine( this.authenticator.credentialsExist + '-a-' );
						await this.authenticator.clearCredentials();
						this.logChannel.appendLine( this.authenticator.credentialsExist + '-b-' );
						await this.credentialExistence();
						this.logChannel.appendLine( this.authenticator.credentialsExist + '-c-' );

					} catch ( error ) {
						this.logChannel.appendLine( JSON.stringify( error ) );
					}
					break;
				}
				case 'saveCredentials': {
					this.logChannel.appendLine( 'Credential save requested' );
					this.logChannel.appendLine( JSON.stringify( data.values ) );
					this.logChannel.appendLine( this.authenticator.credentialsExist + '' );
					await this.authenticator.saveCredentials( data.values );
					this.logChannel.appendLine( this.authenticator.credentialsExist + '' );
					await this.credentialExistence();
					break;
				}
			}
		} );
	}

	public credentialExistence = async () => {
		if ( this._view ) {
			this._view.show?.( true );
			this._view.webview.postMessage( { type: 'credentialExistence', exist: this.authenticator.credentialsExist } );
		}
	};

	private _getHtmlForWebview = ( webview: vscode.Webview ) => {

		this.logChannel.appendLine( 'view is called' );

		const scriptUri = webview.asWebviewUri( vscode.Uri.joinPath( this._extensionUri, 'media', 'main.js' ) );

		const styleResetUri = webview.asWebviewUri( vscode.Uri.joinPath( this._extensionUri, 'media', 'reset.css' ) );
		const styleBulmaUri = webview.asWebviewUri( vscode.Uri.joinPath( this._extensionUri, 'media', 'bulma.css' ) );

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

				<link href="${ styleBulmaUri }" rel="stylesheet">
				<link href="${ styleResetUri }" rel="stylesheet">
				
				<title>Angular Nouns</title>
			</head>
			<body>
				<div class="container is-fluid pt-4">
					<article class="panel is-primary" id="credentialContainer">
						<p class="panel-heading">Save The Noun Project API Credentials</p>
						<div class="field is-horizontal">
							<div class="field-label is-normal">
								<label class="label">Key</label>
							</div>
							<div class="field-body">
								<div class="field">
									<p class="control">
										<input class="input is-small is-fullwidth" type="text" id="apiCredKey">
									</p>
								</div>
							</div>
						</div>
						<div class="field is-horizontal">
							<div class="field-label is-normal">
								<label class="label">Secret</label>
							</div>
							<div class="field-body">
								<div class="field">
									<p class="control">
										<input class="input is-small" type="text" id="apiCredSecret">
									</p>
								</div>
							</div>
						</div>
						<div class="panel-block">
							<button class="button is-primary is-small ml-auto" id="buttonTNPCredentialsSubmit">Submit</button>
						</div>
					</article>

					<div class="field is-grouped is-grouped-right">
							<p class="control">
								
							</p>
						</div>
					</div>
				</div>


				<button id="buttonAddKey">Add API Key</button>
				<button id="buttonAddSecret">Add API Secret</button>

				<button id="buttonClearCredentials">Clear Credentials</button> 

				<hr>

				<ul class="color-list"></ul>

				<button class="add-color-button">Add Color</button>

				<script nonce="${ nonce }" src="${ scriptUri }"></script>
			</body>
			</html>`;
	};
}

class Authenticator {

	public credentialsExist = false;

	constructor( private secretStorage: vscode.SecretStorage ) {
		this.setExistence();
	}

	private setExistence = async () => {
		this.credentialsExist = !!( await this.getCredentials() );
	};

	public getKey = async () => {
		return await this.secretStorage.get( 'ng_nouns_the_noun_project_key' );
	};

	public getSecret = async () => {
		return await this.secretStorage.get( 'ng_nouns_the_noun_project_secret' );
	};

	public getCredentials = async (): Promise<{ key: string, secret: string } | null> => {
		const key = await this.secretStorage.get( 'ng_nouns_the_noun_project_key' );
		const secret = await this.secretStorage.get( 'ng_nouns_the_noun_project_secret' );
		if ( !!key && !!secret ) {
			this.credentialsExist = true;
			return { key, secret };
		}
		this.credentialsExist = false;
		return null;
	};

	public clearCredentials = async (): Promise<void> => {
		await this.secretStorage.store( 'ng_nouns_the_noun_project_secret', '' );
		await this.secretStorage.store( 'ng_nouns_the_noun_project_key', '' );
		await this.setExistence();
	};

	public saveCredentials = async ( payload: { key: string, secret: string } ): Promise<void> => {
		const { key, secret } = payload;
		await this.secretStorage.store( 'ng_nouns_the_noun_project_key', key );
		await this.secretStorage.store( 'ng_nouns_the_noun_project_secret', secret );
		await this.setExistence();
	};
}

// this method is called when your extension is deactivated
export function deactivate () { }
