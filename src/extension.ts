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


	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand( 'ng-nouns-companion.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage( 'Hello World from Angular Nouns Companion!' );
	} );
	context.subscriptions.push( disposable );

	const suhDisposable = vscode.commands.registerCommand( 'ng-nouns-companion.startUpHappened', () => {
		console.log( 'Startup happened function is now initiated' );
		vscode.window.showInformationMessage( 'NG-Nouns Started!' );
	} );
	context.subscriptions.push( suhDisposable );
}

// this method is called when your extension is deactivated
export function deactivate () { }
