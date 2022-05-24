// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate ( context: vscode.ExtensionContext ) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log( 'Congratulations, your extension "ng-nouns-companion" is now active!' );

	vscode.window.showInformationMessage( 'Extension enabled' );

	setTimeout( () => {
		vscode.window.showInformationMessage( '10 seconds passed' );
	}, 10000 );
	setTimeout( () => {
		vscode.window.showInformationMessage( '3 seconds passed' );
	}, 3000 );
	setTimeout( () => {
		vscode.window.showInformationMessage( '1 second passed' );
	}, 1000 );

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
