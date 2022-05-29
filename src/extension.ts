/* eslint-disable @typescript-eslint/naming-convention */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { v4 as uuid } from 'uuid';
import crypto = require( 'crypto' );
const oauth1a = require( 'oauth-1.0a' );
import axios from 'axios';

export type Credentials = {
	key: string,
	secret: string,
};

export type Settings = {
	iconFile: string,
};

export type State = {
	credentials: Credentials,
	settings: Settings,
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate ( context: vscode.ExtensionContext ) {

	const logChannel = vscode.window.createOutputChannel( 'Angular Nouns' );

	logChannel.appendLine( 'Extension enabled' );

	logChannel.show();

	// This is how to show notification
	// vscode.window.showInformationMessage( 'Extension enabled' );

	const provider = new NounViewProvider( context.extensionUri, logChannel );

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider( NounViewProvider.viewType, provider )
	);



	// context.subscriptions.push(
	// 	vscode.commands.registerCommand( 'ng-nouns.setTNPSecret', async () => {
	// 		await authenticator.addSecret();
	// 	} )
	// );


	// logChannel.appendLine( JSON.stringify( vscode.workspace.workspaceFolders ) );

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

	public state: State = {} as State;
	private stateReceived = false;
	public settingsWatcher: vscode.FileSystemWatcher;
	public settings: Settings | null = null;

	public static readonly viewType = 'ngnouns.nounView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private logChannel: vscode.OutputChannel,
	) {
		this.logChannel.appendLine( 'Constructor is run on view provider' );
		this.settingsWatcher = vscode.workspace.createFileSystemWatcher( '**/ng-nouns.json' );
		this.initiateSettingsWatcher();
	}

	private initiateSettingsWatcher = async () => {
		this.settingsWatcher.onDidChange( this.settingsFileChanged );
		this.settingsWatcher.onDidCreate( this.settingsFileChanged );
		this.settingsWatcher.onDidDelete( this.settingsFileChanged );
		this.settingsFileChanged();
	};

	private settingsFileChanged = async () => {
		for ( const settingFileUri of ( await vscode.workspace.findFiles( '**/ng-nouns.json' ) ) ) {
			// this.log( 'Settings file found' );
			const fileContent = await vscode.workspace.fs.readFile( settingFileUri );
			this.settings = JSON.parse( fileContent.toString() );
		}
		await this.sendState();
	};

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
				case 'logAppend': {
					this.logChannel.appendLine( '>>>' + data.log );
					break;
				}
				case 'stateUpdate': {
					this.log( 'State Update Received' );
					await this.receiveState( data.state, data.shouldEcho );
					break;
				}
				case 'search': {
					this.log( 'Search Received' );
					await this.search( data.query );
					break;
				}
			}
		} );
	}

	public search = async ( payload: string ) => {
		// // this.log( 'Sending request' );
		// // const { data, status } = await axios.get( 'https://reqres.in/api/users?page=2' );
		// // this.log( '=================================' );
		// // this.log( status );
		// // this.log( '=================================' );
		// // this.log( data );
		// const { key, secret } = this.state.credentials;
		// const oauth = oauth1a( {
		// 	consumer: { key, secret },
		// 	signature_method: 'HMAC-SHA1',
		// 	hash_function ( base_string: any, key: string ) {
		// 		return crypto
		// 			.createHmac( 'sha1', key )
		// 			.update( base_string )
		// 			.digest( 'base64' );
		// 	},
		// } );

		// const request = {
		// 	url: `https://api.thenounproject.com/icons/${ payload }`,
		// 	method: 'GET'
		// };

		// const authorization = oauth.authorize( request );
		// const authHeader = oauth.toHeader( authorization );

		// try {
		// 	this.log( 'Authorization' );
		// 	this.log( '=================================' );
		// 	this.log( authorization );

		// 	this.log( 'Auth Header' );
		// 	this.log( '=================================' );
		// 	this.log( authHeader );

		// 	this.log( 'State' );
		// 	this.log( '=================================' );
		// 	this.log( this.state );
		// 	const { data, status } = await axios.get( request.url, { headers: authHeader } );
		// 	// const data: any = await response.json();
		// 	this.log( 'Payload' );
		// 	this.log( '=================================' );
		// 	this.log( payload );
		// 	this.log( 'Request.url' );
		// 	this.log( '=================================' );
		// 	this.log( request.url );
		// 	this.log( 'status' );
		// 	this.log( '=================================' );
		// 	this.log( status );
		// 	this.log( 'data' );
		// 	this.log( '=================================' );
		// 	this.log( data );
		// } catch ( error ) {
		// 	this.log( 'error' );
		// 	this.log( '=================================' );
		// 	// this.log( error );
		// 	console.error( error );
		// }
		this._view?.webview.postMessage( { type: 'searchResult', result: searchResultDummy } );
	};

	public log = ( payload: any ) => {
		if ( typeof payload !== 'string' ) {
			this.logChannel.appendLine( JSON.stringify( payload ) );
		} else {
			this.logChannel.appendLine( payload );
		}
	};

	public sendState = async () => {
		while ( !this.stateReceived ) {
			await waiter();
		}
		if ( this.settings ) { this.state.settings = this.settings; }
		this._view?.webview.postMessage( { type: 'stateUpdate', state: this.state } );
	};

	public receiveState = async ( payload: State, shouldEcho = false ) => {
		this.state = JSON.parse( JSON.stringify( payload ) );
		this.log( this.state );
		if ( shouldEcho ) { await this.sendState(); }
		this.stateReceived = true;
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

				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src ${ webview.cspSource }; script-src 'nonce-${ nonce }';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${ styleBulmaUri }" rel="stylesheet">
				<link href="${ styleResetUri }" rel="stylesheet">

				<title>Angular Nouns</title>
			</head>
			<body>
				<div class="container is-fluid pt-4" id="credentialPending">
					<article class="panel is-primary">
						<p class="panel-heading">Save The Noun Project API Credentials</p>

						<div class="field is-horizontal">
							<div class="field-label is-normal"><label class="label">Key</label></div>
							<div class="field-body"><div class="field"><p class="control"><input class="input is-small is-fullwidth" type="text" id="apiCredKey"></p></div></div>
						</div>

						<div class="field is-horizontal">
							<div class="field-label is-normal"><label class="label">Secret</label></div>
							<div class="field-body"><div class="field"><p class="control"><input class="input is-small is-fullwidth" type="text" id="apiCredSecret"></p></div></div>
						</div>

						<div class="panel-block">
							<button class="button is-primary is-small ml-auto" id="buttonTNPCredentialsSubmit">Submit</button>
						</div>
					</article>
				</div>

				<div class="container is-fluid pt-4" id="credentialActive">
					<div class="columns">
						<div class="column">
							<button id="buttonClearCredentials" class="ml-auto">Clear Credentials</button> 
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal"><label class="label">Search SVG</label></div>
						<div class="field-body"><div class="field"><p class="control"><input class="input is-small is-fullwidth" type="text" id="searchBox"></p></div></div>
					</div>
					<button id="buttonSearchSVG" class="ml-auto">Search</button>
				</div>

				<hr>

				<div id="icon-list"><div class="box">Gecici</div></div>

				<script nonce="${ nonce }" src="${ scriptUri }"></script>
			</body>
			</html>`;
	};
}

// this method is called when your extension is deactivated
export function deactivate () { }


const searchResultDummy = {
	"generated_at": "Sun, 29 May 2022 08:43:04 GMT",
	"icons": [
		{
			"attribution": "users by Mike Finch from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/22000-600.png",
			"collections": [],
			"date_uploaded": "2013-08-23",
			"id": "22000",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/22000",
			"preview_url": "https://static.thenounproject.com/png/22000-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/22000-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/22000-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 16425,
					"slug": "multiple-users"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 18045,
					"slug": "user-group"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Mike Finch",
				"permalink": "/mkfnch",
				"username": "mkfnch"
			},
			"uploader_id": "19423",
			"year": 2013
		},
		{
			"attribution": "users by David Vickhoff from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/28831-600.png",
			"collections": [],
			"date_uploaded": "2014-01-08",
			"id": "28831",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/28831",
			"preview_url": "https://static.thenounproject.com/png/28831-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/28831-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/28831-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 1463,
					"slug": "couple"
				},
				{
					"id": 1201,
					"slug": "friend"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 3327,
					"slug": "portrait"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 3512,
					"slug": "social"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "David Vickhoff",
				"permalink": "/davidvickhoff",
				"username": "davidvickhoff"
			},
			"uploader_id": "124093",
			"year": 2014
		},
		{
			"attribution": "users by Garrett Knoll from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/32013-600.png",
			"collections": [],
			"date_uploaded": "2014-02-03",
			"id": "32013",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/32013",
			"preview_url": "https://static.thenounproject.com/png/32013-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/32013-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/32013-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 10896,
					"slug": "group-chat"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 296,
					"slug": "share"
				},
				{
					"id": 963,
					"slug": "team"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "New York, NY, US",
				"name": "Garrett Knoll",
				"permalink": "/g_a.k_",
				"username": "g_a.k_"
			},
			"uploader_id": "21673",
			"year": 2014
		},
		{
			"attribution": "users by Lorena Salagre from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/32253-600.png",
			"collections": [],
			"date_uploaded": "2014-02-04",
			"id": "32253",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/32253",
			"preview_url": "https://static.thenounproject.com/png/32253-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/32253-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/32253-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 963,
					"slug": "team"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Lorena Salagre",
				"permalink": "/lorens",
				"username": "lorens"
			},
			"uploader_id": "250895",
			"year": 2014
		},
		{
			"attribution": "users by Lorena Salagre from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/32353-600.png",
			"collections": [],
			"date_uploaded": "2014-02-04",
			"id": "32353",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/32353",
			"preview_url": "https://static.thenounproject.com/png/32353-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/32353-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/32353-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 2051,
					"slug": "avatar"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 445,
					"slug": "user"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Lorena Salagre",
				"permalink": "/lorens",
				"username": "lorens"
			},
			"uploader_id": "250895",
			"year": 2014
		},
		{
			"attribution": "users by Doub.co from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/33931-600.png",
			"collections": [],
			"date_uploaded": "2014-02-12",
			"id": "33931",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/33931",
			"preview_url": "https://static.thenounproject.com/png/33931-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/33931-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/33931-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 24487,
					"slug": "leaders"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 963,
					"slug": "team"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "İzmir, TR",
				"name": "Doub.co",
				"permalink": "/doub",
				"username": "doub"
			},
			"uploader_id": "13597",
			"year": 2014
		},
		{
			"attribution": "users by AS Design from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/34668-600.png",
			"collections": [],
			"date_uploaded": "2014-02-14",
			"id": "34668",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/34668",
			"preview_url": "https://static.thenounproject.com/png/34668-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/34668-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/34668-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 602,
					"slug": "person"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Berdyansk, zaporozhie, UA",
				"name": "AS Design",
				"permalink": "/audasamora",
				"username": "audasamora"
			},
			"uploader_id": "223845",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/36217-600.png",
			"collections": [],
			"date_uploaded": "2014-02-24",
			"id": "36217",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/36217",
			"preview_url": "https://static.thenounproject.com/png/36217-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/36217-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/36217-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 25535,
					"slug": "social-nerwork"
				},
				{
					"id": 963,
					"slug": "team"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/36285-600.png",
			"collections": [],
			"date_uploaded": "2014-02-25",
			"id": "36285",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/36285",
			"preview_url": "https://static.thenounproject.com/png/36285-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/36285-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/36285-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 334,
					"slug": "community"
				},
				{
					"id": 16188,
					"slug": "workers"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Björn Andersson from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/47164-600.png",
			"collections": [],
			"date_uploaded": "2014-04-30",
			"id": "47164",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/47164",
			"preview_url": "https://static.thenounproject.com/png/47164-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/47164-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/47164-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 12553,
					"slug": "shoulders"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 612,
					"slug": "head"
				},
				{
					"id": 31965,
					"slug": "flat-ui"
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Enskededalen, Stockholm, SE",
				"name": "Björn Andersson",
				"permalink": "/bjorna1",
				"username": "bjorna1"
			},
			"uploader_id": "15446",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/48666-600.png",
			"collections": [],
			"date_uploaded": "2014-05-09",
			"id": "48666",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/48666",
			"preview_url": "https://static.thenounproject.com/png/48666-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/48666-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/48666-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 3512,
					"slug": "social"
				},
				{
					"id": 2488,
					"slug": "society"
				},
				{
					"id": 3770,
					"slug": "student"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 9851,
					"slug": "students"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 24487,
					"slug": "leaders"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 334,
					"slug": "community"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 669,
					"slug": "administration"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 13527,
					"slug": "females"
				},
				{
					"id": 160,
					"slug": "female"
				},
				{
					"id": 14901,
					"slug": "admin"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/48667-600.png",
			"collections": [],
			"date_uploaded": "2014-05-09",
			"id": "48667",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/48667",
			"preview_url": "https://static.thenounproject.com/png/48667-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/48667-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/48667-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 29522,
					"slug": "men-and-women"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 2488,
					"slug": "society"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 9851,
					"slug": "students"
				},
				{
					"id": 3770,
					"slug": "student"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 24487,
					"slug": "leaders"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 19199,
					"slug": "consultant"
				},
				{
					"id": 334,
					"slug": "community"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 669,
					"slug": "administration"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 1201,
					"slug": "friend"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 7990,
					"slug": "labourer"
				},
				{
					"id": 12920,
					"slug": "labour"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 14901,
					"slug": "admin"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Vittorio Maria Vecchi from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/48847-600.png",
			"collections": [],
			"date_uploaded": "2014-05-10",
			"id": "48847",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/48847",
			"preview_url": "https://static.thenounproject.com/png/48847-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/48847-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/48847-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 445,
					"slug": "user"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Trapani, Trapani, IT",
				"name": "Vittorio Maria Vecchi",
				"permalink": "/VMV",
				"username": "VMV"
			},
			"uploader_id": "211989",
			"year": 2014
		},
		{
			"attribution": "users by Alexander Smith from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/49543-600.png",
			"collections": [],
			"date_uploaded": "2014-05-12",
			"id": "49543",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/49543",
			"preview_url": "https://static.thenounproject.com/png/49543-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/49543-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/49543-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 3470,
					"slug": "login"
				},
				{
					"id": 33735,
					"slug": "log-on"
				},
				{
					"id": 3469,
					"slug": "log-in"
				},
				{
					"id": 11212,
					"slug": "heads"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 33734,
					"slug": "computer-login"
				},
				{
					"id": 445,
					"slug": "user"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Alexander Smith",
				"permalink": "/alexander3",
				"username": "alexander3"
			},
			"uploader_id": "368982",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/49597-600.png",
			"collections": [],
			"date_uploaded": "2014-05-12",
			"id": "49597",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/49597",
			"preview_url": "https://static.thenounproject.com/png/49597-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/49597-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/49597-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 25276,
					"slug": "programmers"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 3770,
					"slug": "student"
				},
				{
					"id": 9851,
					"slug": "students"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 2629,
					"slug": "website"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 29163,
					"slug": "typist"
				},
				{
					"id": 8312,
					"slug": "typing"
				},
				{
					"id": 3430,
					"slug": "test"
				},
				{
					"id": 33768,
					"slug": "team-leader"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 170,
					"slug": "male"
				},
				{
					"id": 24487,
					"slug": "leaders"
				},
				{
					"id": 3786,
					"slug": "computing"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 33767,
					"slug": "architects"
				},
				{
					"id": 2397,
					"slug": "architect"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 8540,
					"slug": "exam"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 14901,
					"slug": "admin"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/49599-600.png",
			"collections": [],
			"date_uploaded": "2014-05-12",
			"id": "49599",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/49599",
			"preview_url": "https://static.thenounproject.com/png/49599-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/49599-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/49599-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 25276,
					"slug": "programmers"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 18274,
					"slug": "officers"
				},
				{
					"id": 30118,
					"slug": "office-people"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 3770,
					"slug": "student"
				},
				{
					"id": 9851,
					"slug": "students"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 29163,
					"slug": "typist"
				},
				{
					"id": 8312,
					"slug": "typing"
				},
				{
					"id": 3430,
					"slug": "test"
				},
				{
					"id": 33769,
					"slug": "team-leaders"
				},
				{
					"id": 33768,
					"slug": "team-leader"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 170,
					"slug": "male"
				},
				{
					"id": 3786,
					"slug": "computing"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 33767,
					"slug": "architects"
				},
				{
					"id": 2397,
					"slug": "architect"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 24487,
					"slug": "leaders"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 8540,
					"slug": "exam"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 14901,
					"slug": "admin"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Marta Domenech Canet from Noun Project",
			"collections": [],
			"date_uploaded": "2014-05-21",
			"icon_url": "https://static.thenounproject.com/noun-svg/51354.svg?Expires=1653817384&Signature=dkxeRlJLITCy7i6tMKojaLGWD86zmZQ7EpdqQsY8icsAuw-JWl3IHuax0CYWh9~Xqk8WienazOoomPWgJnZW4IQB6yU38gk9xnn-EkIHEwRnLiXVvKoQDfyAGISR3mshB2CUWZpuSaSUt3MMQYWTbUvh89uSfRGpeO~vzGAHeiQ_&Key-Pair-Id=APKAI5ZVHAXN65CHVU2Q",
			"id": "51354",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "public-domain",
			"nounji_free": "0",
			"permalink": "/term/users/51354",
			"preview_url": "https://static.thenounproject.com/png/51354-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/51354-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/51354-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				},
				{
					"id": 1578,
					"slug": "women"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Marta Domenech Canet",
				"permalink": "/MartaDudu",
				"username": "MartaDudu"
			},
			"uploader_id": "335995",
			"year": 2014
		},
		{
			"attribution": "users by Francesco Terzini from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/52394-600.png",
			"collections": [],
			"date_uploaded": "2014-05-27",
			"id": "52394",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/52394",
			"preview_url": "https://static.thenounproject.com/png/52394-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/52394-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/52394-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 2051,
					"slug": "avatar"
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Firenze, Toscana, IT",
				"name": "Francesco Terzini",
				"permalink": "/fterzini",
				"username": "fterzini"
			},
			"uploader_id": "13818",
			"year": 2014
		},
		{
			"attribution": "users by Jetro Cabau Quirós from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/54248-600.png",
			"collections": [
				{
					"author": {
						"location": "El Puerto de Santa María, Andalucia, ES",
						"name": "Jetro Cabau Quirós",
						"permalink": "/Jetro",
						"username": "Jetro"
					},
					"author_id": "10018",
					"date_created": "2014-06-06 22:54:01",
					"date_updated": "2014-06-06 22:54:01",
					"description": "",
					"id": "117",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Mobile development",
					"permalink": "/Jetro/collection/mobile-development",
					"slug": "mobile-development",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"mobile",
						" iphone ",
						" developer",
						"code",
						"gestual",
						"fingers",
						"screen",
						"icons",
						"apps"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-06-06",
			"id": "54248",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/54248",
			"preview_url": "https://static.thenounproject.com/png/54248-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/54248-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/54248-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 17178,
					"slug": "interactive"
				},
				{
					"id": 30764,
					"slug": "interactive-device"
				},
				{
					"id": 440,
					"slug": "iphone"
				},
				{
					"id": 908,
					"slug": "mobile"
				},
				{
					"id": 2827,
					"slug": "mobile-phone"
				},
				{
					"id": 38596,
					"slug": "mobile-users"
				},
				{
					"id": 462,
					"slug": "phone"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 1293,
					"slug": "screen"
				},
				{
					"id": 5927,
					"slug": "smart-phone"
				},
				{
					"id": 158,
					"slug": "tech"
				},
				{
					"id": 159,
					"slug": "technology"
				},
				{
					"id": 4383,
					"slug": "touch-screen"
				},
				{
					"id": 3206,
					"slug": "interaction"
				},
				{
					"id": 7923,
					"slug": "icons"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 4052,
					"slug": "apps"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 4585,
					"slug": "company"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 2920,
					"slug": "device"
				},
				{
					"id": 4386,
					"slug": "electronic"
				},
				{
					"id": 2058,
					"slug": "fingers"
				},
				{
					"id": 38593,
					"slug": "finguers"
				},
				{
					"id": 21175,
					"slug": "gestual"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 4061,
					"slug": "handheld-device"
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "El Puerto de Santa María, Andalucia, ES",
				"name": "Jetro Cabau Quirós",
				"permalink": "/Jetro",
				"username": "Jetro"
			},
			"uploader_id": "10018",
			"year": 2014
		},
		{
			"attribution": "users by Matthew R. Miller from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/59497-600.png",
			"collections": [
				{
					"author": {
						"location": "Los Angeles, California, US",
						"name": "Matthew R. Miller",
						"permalink": "/mattermill",
						"username": "mattermill"
					},
					"author_id": "885",
					"date_created": "2014-07-10 19:31:08",
					"date_updated": "2014-07-10 19:31:08",
					"description": "",
					"id": "472",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Characters",
					"permalink": "/mattermill/collection/characters",
					"slug": "characters",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"round",
						" simple",
						"friendly",
						"ui",
						"interface",
						"small"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-07-10",
			"id": "59497",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/59497",
			"preview_url": "https://static.thenounproject.com/png/59497-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/59497-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/59497-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 7517,
					"slug": "user-interface"
				},
				{
					"id": 39176,
					"slug": "user-avatar"
				},
				{
					"id": 25469,
					"slug": "user-account"
				},
				{
					"id": 43414,
					"slug": "ui-element"
				},
				{
					"id": 19319,
					"slug": "ui"
				},
				{
					"id": 5020,
					"slug": "small"
				},
				{
					"id": 8692,
					"slug": "simple"
				},
				{
					"id": 5853,
					"slug": "round"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 4359,
					"slug": "outline"
				},
				{
					"id": 2839,
					"slug": "interface"
				},
				{
					"id": 12134,
					"slug": "friendly"
				},
				{
					"id": 6924,
					"slug": "bust"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 15232,
					"slug": "user-profile"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Los Angeles, California, US",
				"name": "Matthew R. Miller",
				"permalink": "/mattermill",
				"username": "mattermill"
			},
			"uploader_id": "885",
			"year": 2014
		},
		{
			"attribution": "users by Clay Gootgeld from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/59888-600.png",
			"collections": [],
			"date_uploaded": "2014-07-12",
			"id": "59888",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/59888",
			"preview_url": "https://static.thenounproject.com/png/59888-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/59888-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/59888-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 44888,
					"slug": "multiuser"
				},
				{
					"id": 16425,
					"slug": "multiple-users"
				},
				{
					"id": 44887,
					"slug": "multiple-profiles"
				},
				{
					"id": 44886,
					"slug": "multiple-accounts"
				},
				{
					"id": 8609,
					"slug": "multi-user"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 445,
					"slug": "user"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Orlando, Florida, US",
				"name": "Clay Gootgeld",
				"permalink": "/claygdesign",
				"username": "claygdesign"
			},
			"uploader_id": "423191",
			"year": 2014
		},
		{
			"attribution": "users by Stefan Parnarov from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/60059-600.png",
			"collections": [],
			"date_uploaded": "2014-07-14",
			"id": "60059",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/60059",
			"preview_url": "https://static.thenounproject.com/png/60059-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/60059-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/60059-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 14518,
					"slug": "about-us"
				},
				{
					"id": 2051,
					"slug": "avatar"
				},
				{
					"id": 4585,
					"slug": "company"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 445,
					"slug": "user"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Sofia, BG",
				"name": "Stefan Parnarov",
				"permalink": "/sapi",
				"username": "sapi"
			},
			"uploader_id": "31590",
			"year": 2014
		},
		{
			"attribution": "users by Lorena Salagre from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/60875-600.png",
			"collections": [],
			"date_uploaded": "2014-07-20",
			"id": "60875",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/60875",
			"preview_url": "https://static.thenounproject.com/png/60875-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/60875-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/60875-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 42286,
					"slug": "user-accounts"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 1457,
					"slug": "contacts"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 2051,
					"slug": "avatar"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Lorena Salagre",
				"permalink": "/lorens",
				"username": "lorens"
			},
			"uploader_id": "250895",
			"year": 2014
		},
		{
			"attribution": "users by Seona Kim from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/62986-600.png",
			"collections": [],
			"date_uploaded": "2014-08-04",
			"id": "62986",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/62986",
			"preview_url": "https://static.thenounproject.com/png/62986-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/62986-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/62986-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 334,
					"slug": "community"
				},
				{
					"id": 22574,
					"slug": "cooperate"
				},
				{
					"id": 47178,
					"slug": "coorperation"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1820,
					"slug": "together"
				},
				{
					"id": 460,
					"slug": "work"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Seoul, KR",
				"name": "Seona  Kim",
				"permalink": "/seona.kim",
				"username": "seona.kim"
			},
			"uploader_id": "237484",
			"year": 2014
		},
		{
			"attribution": "users by Xavier Gironès from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/63305-600.png",
			"collections": [],
			"date_uploaded": "2014-08-05",
			"id": "63305",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/63305",
			"preview_url": "https://static.thenounproject.com/png/63305-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/63305-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/63305-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 39176,
					"slug": "user-avatar"
				},
				{
					"id": 12037,
					"slug": "siblings"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 39175,
					"slug": "profile-avatar"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1463,
					"slug": "couple"
				},
				{
					"id": 2051,
					"slug": "avatar"
				},
				{
					"id": 38256,
					"slug": "account-profile"
				},
				{
					"id": 39748,
					"slug": "account-avatar"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 15232,
					"slug": "user-profile"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Sant Gregori, Girona, ES",
				"name": "Xavier Gironès",
				"permalink": "/xgirones",
				"username": "xgirones"
			},
			"uploader_id": "441047",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64757-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64757",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64757",
			"preview_url": "https://static.thenounproject.com/png/64757-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64757-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64757-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64758-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64758",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64758",
			"preview_url": "https://static.thenounproject.com/png/64758-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64758-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64758-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64759-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64759",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64759",
			"preview_url": "https://static.thenounproject.com/png/64759-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64759-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64759-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64760-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64760",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64760",
			"preview_url": "https://static.thenounproject.com/png/64760-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64760-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64760-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64761-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64761",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64761",
			"preview_url": "https://static.thenounproject.com/png/64761-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64761-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64761-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64762-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64762",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64762",
			"preview_url": "https://static.thenounproject.com/png/64762-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64762-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64762-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64763-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64763",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64763",
			"preview_url": "https://static.thenounproject.com/png/64763-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64763-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64763-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64764-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64764",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64764",
			"preview_url": "https://static.thenounproject.com/png/64764-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64764-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64764-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64765-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64765",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64765",
			"preview_url": "https://static.thenounproject.com/png/64765-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64765-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64765-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/64766-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2014-08-13 17:00:17",
					"date_updated": "2014-08-13 17:00:17",
					"description": "",
					"id": "769",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users#1",
					"permalink": "/wilsonjoseph/collection/users1",
					"slug": "users1",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"user",
						"users",
						"man",
						"woman",
						"men",
						"women",
						"people",
						"person",
						"human",
						"humans",
						"worker",
						"workers",
						"coders",
						"coder",
						"developer",
						"developers",
						"engineer",
						"engineers",
						"manager",
						"managers",
						"admin",
						"administrator",
						"administrators",
						"browsing",
						"browse",
						"chat",
						"client",
						"code",
						"communication",
						"computer",
						"laptop",
						"designer",
						"designers",
						"customer",
						"customers",
						"ecommerce",
						"employee",
						"employees",
						"employer",
						"employers",
						"friends",
						"hacker",
						"hackers",
						"hr",
						"human resource",
						"internet",
						"intranet",
						"monitor",
						"network",
						"office",
						"pc",
						"profile",
						"programmer",
						"service",
						"support",
						"surfing",
						"social media",
						"resource",
						"staff",
						"team building",
						"team",
						"teamwork",
						"management",
						"marketing",
						"meeting",
						"members",
						"connection",
						"leader",
						"leadership",
						"working"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-08-13",
			"id": "64766",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/64766",
			"preview_url": "https://static.thenounproject.com/png/64766-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/64766-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/64766-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 1017,
					"slug": "monitor"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 660,
					"slug": "office"
				},
				{
					"id": 8663,
					"slug": "pc"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15472,
					"slug": "marketing"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 36437,
					"slug": "intranet"
				},
				{
					"id": 156,
					"slug": "laptop"
				},
				{
					"id": 48394,
					"slug": "laptop-group"
				},
				{
					"id": 48395,
					"slug": "laptop-users"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 5601,
					"slug": "leadership"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 11802,
					"slug": "teamwork"
				},
				{
					"id": 48398,
					"slug": "tech-group"
				},
				{
					"id": 48399,
					"slug": "tech-team"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 48397,
					"slug": "team-tech"
				},
				{
					"id": 48396,
					"slug": "team-building"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 26170,
					"slug": "resource"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3510,
					"slug": "social-media"
				},
				{
					"id": 14340,
					"slug": "staff"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 516,
					"slug": "surfing"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 1821,
					"slug": "working"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 157,
					"slug": "computer"
				},
				{
					"id": 1139,
					"slug": "connection"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 29070,
					"slug": "coders"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 27151,
					"slug": "administrators"
				},
				{
					"id": 8704,
					"slug": "browse"
				},
				{
					"id": 11164,
					"slug": "browsing"
				},
				{
					"id": 2147,
					"slug": "chat"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 1812,
					"slug": "code"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 1284,
					"slug": "ecommerce"
				},
				{
					"id": 48393,
					"slug": "group-tech"
				},
				{
					"id": 46594,
					"slug": "group-work"
				},
				{
					"id": 13488,
					"slug": "hacker"
				},
				{
					"id": 30303,
					"slug": "hackers"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 32999,
					"slug": "human-resource"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 48392,
					"slug": "group-study"
				},
				{
					"id": 46187,
					"slug": "group-of-users"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 32998,
					"slug": "employers"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 11279,
					"slug": "focus-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1290,
					"slug": ""
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2014
		},
		{
			"attribution": "users by Lorena Salagre from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/65286-600.png",
			"collections": [],
			"date_uploaded": "2014-08-17",
			"id": "65286",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/65286",
			"preview_url": "https://static.thenounproject.com/png/65286-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/65286-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/65286-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 1820,
					"slug": "together"
				},
				{
					"id": 4290,
					"slug": "three"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 10318,
					"slug": "hangout"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 18045,
					"slug": "user-group"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Lorena Salagre",
				"permalink": "/lorens",
				"username": "lorens"
			},
			"uploader_id": "250895",
			"year": 2014
		},
		{
			"attribution": "users by Keira Bui from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/66447-600.png",
			"collections": [],
			"date_uploaded": "2014-08-22",
			"id": "66447",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/66447",
			"preview_url": "https://static.thenounproject.com/png/66447-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/66447-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/66447-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 445,
					"slug": "user"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Keira Bui",
				"permalink": "/keira.tien",
				"username": "keira.tien"
			},
			"uploader_id": "352722",
			"year": 2014
		},
		{
			"attribution": "users by iconsmind.com from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/69721-600.png",
			"collections": [
				{
					"author": {
						"location": "London, GB",
						"name": "iconsmind.com",
						"permalink": "/imicons",
						"username": "imicons"
					},
					"author_id": "438738",
					"date_created": "2014-09-02 05:11:04",
					"date_updated": "2014-09-02 05:23:49",
					"description": "",
					"id": "1009",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "People",
					"permalink": "/imicons/collection/people",
					"slug": "people",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"line-icon",
						"shape",
						"illustration ",
						"design",
						"signs",
						"people",
						"abstract",
						"person",
						"figure"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2014-09-02",
			"id": "69721",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/69721",
			"preview_url": "https://static.thenounproject.com/png/69721-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/69721-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/69721-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 51926,
					"slug": "male-plus-female"
				},
				{
					"id": 18286,
					"slug": "man-and-woman"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 4171,
					"slug": "shape"
				},
				{
					"id": 13600,
					"slug": "signs"
				},
				{
					"id": 28976,
					"slug": "woman-and-man"
				},
				{
					"id": 170,
					"slug": "male"
				},
				{
					"id": 33934,
					"slug": "line-icon"
				},
				{
					"id": 5503,
					"slug": "illustration"
				},
				{
					"id": 6612,
					"slug": "abstract"
				},
				{
					"id": 4692,
					"slug": "boy"
				},
				{
					"id": 18036,
					"slug": "boy-and-girl"
				},
				{
					"id": 2286,
					"slug": "design"
				},
				{
					"id": 160,
					"slug": "female"
				},
				{
					"id": 4484,
					"slug": "figure"
				},
				{
					"id": 2864,
					"slug": "gender"
				},
				{
					"id": 3390,
					"slug": "girl"
				},
				{
					"id": 42144,
					"slug": "girl-and-boy"
				},
				{
					"id": 1578,
					"slug": "women"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "London, GB",
				"name": "iconsmind.com",
				"permalink": "/imicons",
				"username": "imicons"
			},
			"uploader_id": "438738",
			"year": 2014
		},
		{
			"attribution": "users by Austin Condiff from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/70748-600.png",
			"collections": [
				{
					"author": {
						"location": "Dallas, Texas, US",
						"name": "Austin Condiff",
						"permalink": "/acondiff",
						"username": "acondiff"
					},
					"author_id": "54290",
					"date_created": "2015-01-08 20:22:32",
					"date_updated": "2015-01-08 20:22:32",
					"description": "",
					"id": "2243",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Simplicicons",
					"permalink": "/acondiff/collection/simplicicons",
					"slug": "simplicicons",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [],
					"template": "24"
				}
			],
			"date_uploaded": "2014-09-04",
			"id": "70748",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/70748",
			"preview_url": "https://static.thenounproject.com/png/70748-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/70748-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/70748-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 39176,
					"slug": "user-avatar"
				},
				{
					"id": 25469,
					"slug": "user-account"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 39175,
					"slug": "profile-avatar"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 2051,
					"slug": "avatar"
				},
				{
					"id": 38256,
					"slug": "account-profile"
				},
				{
					"id": 39748,
					"slug": "account-avatar"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 15232,
					"slug": "user-profile"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Dallas, Texas, US",
				"name": "Austin Condiff",
				"permalink": "/acondiff",
				"username": "acondiff"
			},
			"uploader_id": "54290",
			"year": 2014
		},
		{
			"attribution": "users by Orlando Marty from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/78349-600.png",
			"collections": [],
			"date_uploaded": "2014-10-10",
			"id": "78349",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/78349",
			"preview_url": "https://static.thenounproject.com/png/78349-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/78349-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/78349-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 19319,
					"slug": "ui"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 25469,
					"slug": "user-account"
				},
				{
					"id": 42286,
					"slug": "user-accounts"
				},
				{
					"id": 11284,
					"slug": "user-experience"
				},
				{
					"id": 7517,
					"slug": "user-interface"
				},
				{
					"id": 15232,
					"slug": "user-profile"
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				},
				{
					"id": 56693,
					"slug": "team-account"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 2051,
					"slug": "avatar"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 1458,
					"slug": "icon"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 17555,
					"slug": "persona"
				},
				{
					"id": 6757,
					"slug": "ux"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "ES",
				"name": "Orlando Marty",
				"permalink": "/orlando.marty",
				"username": "orlando.marty"
			},
			"uploader_id": "260200",
			"year": 2014
		},
		{
			"attribution": "users by Pascal Conil-lacoste from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/78729-600.png",
			"collections": [],
			"date_uploaded": "2014-10-14",
			"id": "78729",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/78729",
			"preview_url": "https://static.thenounproject.com/png/78729-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/78729-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/78729-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 56874,
					"slug": "who-we-are"
				},
				{
					"id": 26,
					"slug": "woman"
				},
				{
					"id": 19769,
					"slug": "us"
				},
				{
					"id": 2146,
					"slug": "silhouette"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 22,
					"slug": "man"
				},
				{
					"id": 170,
					"slug": "male"
				},
				{
					"id": 160,
					"slug": "female"
				},
				{
					"id": 6475,
					"slug": "about"
				},
				{
					"id": 1290,
					"slug": ""
				},
				{
					"id": 56875,
					"slug": "about-us"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Montpellier, FR",
				"name": "Pascal Conil-lacoste",
				"permalink": "/barredespace",
				"username": "barredespace"
			},
			"uploader_id": "196572",
			"year": 2014
		},
		{
			"attribution": "users by Mundo from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/79379-600.png",
			"collections": [],
			"date_uploaded": "2014-10-17",
			"id": "79379",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/79379",
			"preview_url": "https://static.thenounproject.com/png/79379-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/79379-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/79379-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 57702,
					"slug": "user-avatars"
				},
				{
					"id": 42286,
					"slug": "user-accounts"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 1290,
					"slug": ""
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Mundo",
				"permalink": "/DMundo",
				"username": "DMundo"
			},
			"uploader_id": "118153",
			"year": 2014
		},
		{
			"attribution": "users by Mundo from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/79382-600.png",
			"collections": [],
			"date_uploaded": "2014-10-17",
			"id": "79382",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/79382",
			"preview_url": "https://static.thenounproject.com/png/79382-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/79382-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/79382-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 31483,
					"slug": "user-profiles"
				},
				{
					"id": 42286,
					"slug": "user-accounts"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 15978,
					"slug": "members"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 1290,
					"slug": ""
				},
				{
					"id": 57702,
					"slug": "user-avatars"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Mundo",
				"permalink": "/DMundo",
				"username": "DMundo"
			},
			"uploader_id": "118153",
			"year": 2014
		},
		{
			"attribution": "users by Mourad Mokrane from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/82818-600.png",
			"collections": [],
			"date_uploaded": "2014-11-12",
			"id": "82818",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/82818",
			"preview_url": "https://static.thenounproject.com/png/82818-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/82818-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/82818-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 19089,
					"slug": "twin"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 3230,
					"slug": "son"
				},
				{
					"id": 2488,
					"slug": "society"
				},
				{
					"id": 47864,
					"slug": "sidekick"
				},
				{
					"id": 26139,
					"slug": "relative"
				},
				{
					"id": 1465,
					"slug": "relationship"
				},
				{
					"id": 10238,
					"slug": "relation"
				},
				{
					"id": 19244,
					"slug": "population"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 5083,
					"slug": "partners"
				},
				{
					"id": 9855,
					"slug": "twins"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 59887,
					"slug": "kin"
				},
				{
					"id": 59898,
					"slug": "younger"
				},
				{
					"id": 59897,
					"slug": "opponent"
				},
				{
					"id": 59896,
					"slug": "alter-ego"
				},
				{
					"id": 59895,
					"slug": "sidekicks"
				},
				{
					"id": 59894,
					"slug": "mates"
				},
				{
					"id": 59893,
					"slug": "compatriot"
				},
				{
					"id": 59892,
					"slug": "rommate"
				},
				{
					"id": 59891,
					"slug": "clasmate"
				},
				{
					"id": 59890,
					"slug": "purchasers"
				},
				{
					"id": 59889,
					"slug": "shopers"
				},
				{
					"id": 59888,
					"slug": "buyers"
				},
				{
					"id": 4752,
					"slug": "partner"
				},
				{
					"id": 3235,
					"slug": "parent"
				},
				{
					"id": 13481,
					"slug": "pals"
				},
				{
					"id": 4746,
					"slug": "companion"
				},
				{
					"id": 334,
					"slug": "community"
				},
				{
					"id": 18910,
					"slug": "colleague"
				},
				{
					"id": 57703,
					"slug": "clan"
				},
				{
					"id": 13732,
					"slug": "citizens"
				},
				{
					"id": 48420,
					"slug": "chum"
				},
				{
					"id": 824,
					"slug": "children"
				},
				{
					"id": 603,
					"slug": "child"
				},
				{
					"id": 4754,
					"slug": "buddy"
				},
				{
					"id": 33898,
					"slug": "brothers"
				},
				{
					"id": 47859,
					"slug": "associate"
				},
				{
					"id": 4755,
					"slug": "comrade"
				},
				{
					"id": 4165,
					"slug": "crowd"
				},
				{
					"id": 4751,
					"slug": "pal"
				},
				{
					"id": 1330,
					"slug": "mate"
				},
				{
					"id": 8222,
					"slug": "humans"
				},
				{
					"id": 7600,
					"slug": "humanity"
				},
				{
					"id": 10733,
					"slug": "friendship"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 28988,
					"slug": "folks"
				},
				{
					"id": 14163,
					"slug": "folk"
				},
				{
					"id": 3233,
					"slug": "father"
				},
				{
					"id": 658,
					"slug": "family"
				},
				{
					"id": 30138,
					"slug": "customers"
				},
				{
					"id": 4690,
					"slug": "ally"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Moscow, Moscow, RU",
				"name": "Mourad Mokrane",
				"permalink": "/molumen",
				"username": "molumen"
			},
			"uploader_id": "11176",
			"year": 2014
		},
		{
			"attribution": "users by Siddharth Dasari from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/83740-600.png",
			"collections": [],
			"date_uploaded": "2014-11-17",
			"id": "83740",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/83740",
			"preview_url": "https://static.thenounproject.com/png/83740-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/83740-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/83740-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 1820,
					"slug": "together"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 19244,
					"slug": "population"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 7382,
					"slug": "neighbor"
				},
				{
					"id": 11808,
					"slug": "living"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 1806,
					"slug": "growth"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 1201,
					"slug": "friend"
				},
				{
					"id": 7309,
					"slug": "ecosystem"
				},
				{
					"id": 334,
					"slug": "community"
				},
				{
					"id": 53069,
					"slug": "communities"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 56982,
					"slug": "acquaintance"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 926,
					"slug": "winner"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "IN",
				"name": "Siddharth Dasari",
				"permalink": "/siddharthdasari",
				"username": "siddharthdasari"
			},
			"uploader_id": "50854",
			"year": 2014
		},
		{
			"attribution": "users by José Campos from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/84469-600.png",
			"collections": [],
			"date_uploaded": "2014-11-22",
			"id": "84469",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/84469",
			"preview_url": "https://static.thenounproject.com/png/84469-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/84469-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/84469-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 445,
					"slug": "user"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "PT",
				"name": "José Campos",
				"permalink": "/jcampos",
				"username": "jcampos"
			},
			"uploader_id": "93710",
			"year": 2014
		},
		{
			"attribution": "users by Remco Homberg from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/85739-600.png",
			"collections": [],
			"date_uploaded": "2014-12-01",
			"id": "85739",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/85739",
			"preview_url": "https://static.thenounproject.com/png/85739-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/85739-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/85739-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 14512,
					"slug": "profiles"
				},
				{
					"id": 963,
					"slug": "team"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "NL",
				"name": "Remco Homberg",
				"permalink": "/pancdesign",
				"username": "pancdesign"
			},
			"uploader_id": "77024",
			"year": 2014
		},
		{
			"attribution": "users by Stefan Parnarov from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/94121-600.png",
			"collections": [
				{
					"author": {
						"location": "Sofia, BG",
						"name": "Stefan Parnarov",
						"permalink": "/sapi",
						"username": "sapi"
					},
					"author_id": "31590",
					"date_created": "2015-01-12 19:07:18",
					"date_updated": "2015-01-12 19:07:18",
					"description": "",
					"id": "2351",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Communication Icons",
					"permalink": "/sapi/collection/communication-icons",
					"slug": "communication-icons",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"communication",
						"internet",
						"device",
						"connectivity",
						"exchange",
						"messaging",
						"information",
						"communications",
						"gadgets"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2015-01-12",
			"id": "94121",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/94121",
			"preview_url": "https://static.thenounproject.com/png/94121-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/94121-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/94121-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 2651,
					"slug": "internet"
				},
				{
					"id": 440,
					"slug": "iphone"
				},
				{
					"id": 131,
					"slug": "mail"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 10897,
					"slug": "messaging"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 462,
					"slug": "phone"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 51,
					"slug": "information"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 66245,
					"slug": "gadgets"
				},
				{
					"id": 36331,
					"slug": "avatars"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 2650,
					"slug": "communications"
				},
				{
					"id": 334,
					"slug": "community"
				},
				{
					"id": 6891,
					"slug": "connectivity"
				},
				{
					"id": 2920,
					"slug": "device"
				},
				{
					"id": 132,
					"slug": "email"
				},
				{
					"id": 3339,
					"slug": "exchange"
				},
				{
					"id": 1578,
					"slug": "women"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Sofia, BG",
				"name": "Stefan Parnarov",
				"permalink": "/sapi",
				"username": "sapi"
			},
			"uploader_id": "31590",
			"year": 2015
		},
		{
			"attribution": "users by DTE MEDIA from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/95828-600.png",
			"collections": [],
			"date_uploaded": "2015-01-17",
			"id": "95828",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/95828",
			"preview_url": "https://static.thenounproject.com/png/95828-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/95828-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/95828-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "Santa Monica, CA",
				"name": "DTE MEDIA",
				"permalink": "/dtemedia",
				"username": "dtemedia"
			},
			"uploader_id": "186114",
			"year": 2015
		},
		{
			"attribution": "users by Wilson Joseph from Noun Project",
			"attribution_preview_url": "https://static.thenounproject.com/attribution/97901-600.png",
			"collections": [
				{
					"author": {
						"location": "",
						"name": "Wilson Joseph",
						"permalink": "/wilsonjoseph",
						"username": "wilsonjoseph"
					},
					"author_id": "19905",
					"date_created": "2015-01-21 02:08:42",
					"date_updated": "2015-01-21 02:10:30",
					"description": "",
					"id": "2506",
					"is_collaborative": "",
					"is_featured": "0",
					"is_published": "1",
					"is_store_item": "0",
					"name": "Users Icon - Association / Bond / Connected / Social Group / Team / Affiliated",
					"permalink": "/wilsonjoseph/collection/users-icon-association-bond-connected-social-group",
					"slug": "users-icon-association-bond-connected-social-group",
					"sponsor": {},
					"sponsor_campaign_link": "",
					"sponsor_id": "",
					"tags": [
						"users",
						"user",
						"men",
						"women",
						"people",
						"person",
						"persons",
						"Association",
						"bond",
						"connected",
						"connected-users",
						"social-group",
						"social",
						"team",
						"group",
						"management",
						"affiliated",
						"network",
						"user-network",
						"human",
						"account",
						"accounts",
						"avatar",
						"office-people",
						"businessmen",
						"businesswomen",
						"manager",
						"managers",
						"workers",
						"worker",
						"supervisor",
						"supervisors",
						"leaders",
						"leader",
						"team-leader",
						"admin",
						"administrator",
						"developer",
						"coder",
						"developers",
						"designer",
						"designers",
						"architect",
						"architects",
						"client",
						"customer",
						"hacker",
						"male",
						"female",
						"programmer",
						"service",
						"support",
						"employee",
						"employees",
						"employer",
						"human-resource",
						"hr",
						"drivers",
						"driver",
						"profile",
						"travelers",
						"identification",
						"boy",
						"girl",
						"contractor",
						"contractors",
						"engineer",
						"engineers",
						"doctor",
						"doctors",
						"patient",
						"patients",
						"politician",
						"president",
						"ceo",
						"officer",
						"reporter",
						"reader",
						"social-network",
						"friend",
						"friend-group",
						"friends",
						"friends-group",
						"community",
						"society",
						"communication",
						"interaction",
						"meeting"
					],
					"template": "24"
				}
			],
			"date_uploaded": "2015-01-21",
			"id": "97901",
			"is_active": "1",
			"is_explicit": "0",
			"license_description": "creative-commons-attribution",
			"nounji_free": "0",
			"permalink": "/term/users/97901",
			"preview_url": "https://static.thenounproject.com/png/97901-200.png",
			"preview_url_42": "https://static.thenounproject.com/png/97901-42.png",
			"preview_url_84": "https://static.thenounproject.com/png/97901-84.png",
			"sponsor": {},
			"sponsor_campaign_link": null,
			"sponsor_id": "",
			"tags": [
				{
					"id": 11285,
					"slug": "users"
				},
				{
					"id": 1475,
					"slug": "men"
				},
				{
					"id": 471,
					"slug": "network"
				},
				{
					"id": 59212,
					"slug": "office-people"
				},
				{
					"id": 2644,
					"slug": "officer"
				},
				{
					"id": 6709,
					"slug": "patient"
				},
				{
					"id": 53290,
					"slug": "patients"
				},
				{
					"id": 961,
					"slug": "people"
				},
				{
					"id": 602,
					"slug": "person"
				},
				{
					"id": 962,
					"slug": "persons"
				},
				{
					"id": 905,
					"slug": "meeting"
				},
				{
					"id": 31801,
					"slug": "managers"
				},
				{
					"id": 14613,
					"slug": "manager"
				},
				{
					"id": 25189,
					"slug": "hr"
				},
				{
					"id": 23,
					"slug": "human"
				},
				{
					"id": 58995,
					"slug": "human-resource"
				},
				{
					"id": 4306,
					"slug": "identification"
				},
				{
					"id": 3206,
					"slug": "interaction"
				},
				{
					"id": 3309,
					"slug": "leader"
				},
				{
					"id": 24487,
					"slug": "leaders"
				},
				{
					"id": 170,
					"slug": "male"
				},
				{
					"id": 965,
					"slug": "management"
				},
				{
					"id": 11928,
					"slug": "politician"
				},
				{
					"id": 5053,
					"slug": "president"
				},
				{
					"id": 2438,
					"slug": "support"
				},
				{
					"id": 963,
					"slug": "team"
				},
				{
					"id": 60224,
					"slug": "team-leader"
				},
				{
					"id": 14264,
					"slug": "travelers"
				},
				{
					"id": 40534,
					"slug": "traveller"
				},
				{
					"id": 445,
					"slug": "user"
				},
				{
					"id": 68537,
					"slug": "user-network"
				},
				{
					"id": 1578,
					"slug": "women"
				},
				{
					"id": 547,
					"slug": "worker"
				},
				{
					"id": 55075,
					"slug": "supervisors"
				},
				{
					"id": 10836,
					"slug": "supervisor"
				},
				{
					"id": 2145,
					"slug": "profile"
				},
				{
					"id": 17668,
					"slug": "programmer"
				},
				{
					"id": 7533,
					"slug": "reader"
				},
				{
					"id": 2550,
					"slug": "reporter"
				},
				{
					"id": 1223,
					"slug": "service"
				},
				{
					"id": 3512,
					"slug": "social"
				},
				{
					"id": 68536,
					"slug": "social-group"
				},
				{
					"id": 68539,
					"slug": "social-network"
				},
				{
					"id": 2488,
					"slug": "society"
				},
				{
					"id": 16188,
					"slug": "workers"
				},
				{
					"id": 7486,
					"slug": "account"
				},
				{
					"id": 48610,
					"slug": "businesswomen"
				},
				{
					"id": 2931,
					"slug": "ceo"
				},
				{
					"id": 8590,
					"slug": "client"
				},
				{
					"id": 19051,
					"slug": "coder"
				},
				{
					"id": 461,
					"slug": "communication"
				},
				{
					"id": 334,
					"slug": "community"
				},
				{
					"id": 3787,
					"slug": "connected"
				},
				{
					"id": 68535,
					"slug": "connected-users"
				},
				{
					"id": 18980,
					"slug": "contractor"
				},
				{
					"id": 28458,
					"slug": "businessmen"
				},
				{
					"id": 4692,
					"slug": "boy"
				},
				{
					"id": 33329,
					"slug": "accounts"
				},
				{
					"id": 14901,
					"slug": "admin"
				},
				{
					"id": 14744,
					"slug": "administrator"
				},
				{
					"id": 55431,
					"slug": "affiliated"
				},
				{
					"id": 2397,
					"slug": "architect"
				},
				{
					"id": 33767,
					"slug": "architects"
				},
				{
					"id": 28985,
					"slug": "association"
				},
				{
					"id": 2051,
					"slug": "avatar"
				},
				{
					"id": 5107,
					"slug": "bond"
				},
				{
					"id": 68538,
					"slug": "contractors"
				},
				{
					"id": 2437,
					"slug": "customer"
				},
				{
					"id": 7228,
					"slug": "engineer"
				},
				{
					"id": 25641,
					"slug": "engineers"
				},
				{
					"id": 160,
					"slug": "female"
				},
				{
					"id": 1201,
					"slug": "friend"
				},
				{
					"id": 68540,
					"slug": "friend-group"
				},
				{
					"id": 4672,
					"slug": "friends"
				},
				{
					"id": 68541,
					"slug": "friends-group"
				},
				{
					"id": 3390,
					"slug": "girl"
				},
				{
					"id": 960,
					"slug": "group"
				},
				{
					"id": 30035,
					"slug": "employer"
				},
				{
					"id": 19441,
					"slug": "employees"
				},
				{
					"id": 2464,
					"slug": "designer"
				},
				{
					"id": 33136,
					"slug": "designers"
				},
				{
					"id": 7379,
					"slug": "developer"
				},
				{
					"id": 25275,
					"slug": "developers"
				},
				{
					"id": 611,
					"slug": "doctor"
				},
				{
					"id": 18856,
					"slug": "doctors"
				},
				{
					"id": 2511,
					"slug": "driver"
				},
				{
					"id": 44009,
					"slug": "drivers"
				},
				{
					"id": 12054,
					"slug": "employee"
				},
				{
					"id": 13488,
					"slug": "hacker"
				}
			],
			"term": "users",
			"term_id": 11285,
			"term_slug": "users",
			"updated_at": "2019-04-22 19:22:17",
			"uploader": {
				"location": "",
				"name": "Wilson Joseph",
				"permalink": "/wilsonjoseph",
				"username": "wilsonjoseph"
			},
			"uploader_id": "19905",
			"year": 2015
		}
	]
};

export const waiter = ( duration = 1000 ): Promise<void> => {
	return new Promise( resolve => {
		setTimeout( () => {
			resolve();
		}, duration );
	} );
};