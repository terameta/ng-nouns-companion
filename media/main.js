const vscode = acquireVsCodeApi();

const log = ( payload ) => {
	let toLog = payload;
	if ( typeof payload !== 'string' ) {
		toLog = JSON.stringify( payload );
	}
	vscode.postMessage( { type: 'logAppend', log: toLog } );
};

let state = { credentials: { key: '', secret: '' } };

const runAtStart = () => {

	state = vscode.getState() || state;
	checkCredentials();
	sendState();

	window.addEventListener( 'message', event => {
		const message = event.data;
		// vscode.postMessage( { type: 'logAppend', log: JSON.stringify( message ) } );
		if ( message.type === 'stateUpdate' ) { receiveState( message.state ); }
		if ( message.type === 'searchResult' ) { searchResult( message.result ); }
	} );


	// setInterval( async () => {
	// 	try {
	// 		const savedKey = Object.keys( vscode ).join( '|' );
	// 		// const savedKey = await vscode.secrets.get( 'ng_nouns_the_noun_project_key' );
	// 		vscode.postMessage( { type: 'logAppend', log: savedKey } );
	// 	} catch ( error ) {
	// 		vscode.postMessage( { type: 'logAppend', log: 'ERROR:' + JSON.stringify( error ) } );
	// 	}
	// }, 1000 );

	document.querySelector( '#buttonClearCredentials' ).addEventListener( 'click', clearCredentials );
	document.querySelector( '#buttonTNPCredentialsSubmit' ).addEventListener( 'click', saveCredentials );
	document.querySelector( '#buttonSearchSVG' ).addEventListener( 'click', search );
};

const checkCredentials = async () => {
	if ( !!state.credentials.key && !!state.credentials.secret ) {
		document.querySelector( '#credentialPending' ).className = 'is-hidden';
		document.querySelector( '#credentialActive' ).className = '';
	} else {
		document.querySelector( '#credentialPending' ).className = '';
		document.querySelector( '#credentialActive' ).className = 'is-hidden';
	}
};

const search = async () => {
	// const response = await fetch( 'https://reqres.in/api/users?page=2' );
	// const data = await response.json();
	const iconList = document.querySelector( '#icon-list' );
	iconList.textContent = 'Searching, please wait';
	vscode.postMessage( { type: 'search', query: 'users' } );
};

const searchResult = async ( payload ) => {
	const iconListDiv = document.querySelector( '#icon-list' );
	iconListDiv.textContent = '';
	const icons = payload.icons;
	for ( const icon of icons ) {
		const iconDiv = document.createElement( 'div' );
		iconDiv.className = 'box';
		iconDiv.innerHTML = `<img src="${ icon.preview_url_84 }" />`;
		iconListDiv.appendChild( iconDiv );
		// log( icon.id );
	}
	// log( icons.length + '<<<<<' );
};

const saveCredentials = async () => {
	const key = document.querySelector( '#apiCredKey' ).value;
	const secret = document.querySelector( '#apiCredSecret' ).value;
	// vscode.postMessage( { type: 'saveCredentials', values: { key, secret } } );
	state.credentials = { key, secret };
	await checkCredentials();
	await sendState();
};

const clearCredentials = async () => {
	vscode.postMessage( { type: 'clearCredentials' } );
	state.credentials = { key: '', secret: '' };
	await checkCredentials();
	await sendState();
};

const receiveState = async ( payload ) => {
	vscode.setState( payload );
	state = payload;
};

const sendState = async () => {
	vscode.setState( state );
	vscode.postMessage( { type: 'stateUpdate', state } );
};

runAtStart();

// //@ts-check

// // This script will be run within the webview itself
// // It cannot access the main VS Code APIs directly.

// (function () {
// 	const vscode = acquireVsCodeApi();

// 	const oldState = vscode.getState() || { colors: [] };

// 	/** @type {Array<{ value: string }>} */
// 	let colors = oldState.colors;

// 	updateColorList(colors);

// 	document.querySelector('.add-color-button').addEventListener('click', () => {
// 			addColor();
// 	});

// 	// Handle messages sent from the extension to the webview
// 	window.addEventListener('message', event => {
// 			const message = event.data; // The json data that the extension sent
// 			switch (message.type) {
// 					case 'addColor':
// 							{
// 									addColor();
// 									break;
// 							}
// 					case 'clearColors':
// 							{
// 									colors = [];
// 									updateColorList(colors);
// 									break;
// 							}

// 			}
// 	});

// 	/**
// 	 * @param {Array<{ value: string }>} colors
// 	 */
// 	function updateColorList(colors) {
// 			const ul = document.querySelector('.color-list');
// 			ul.textContent = '';
// 			for (const color of colors) {
// 					const li = document.createElement('li');
// 					li.className = 'color-entry';

// 					const colorPreview = document.createElement('div');
// 					colorPreview.className = 'color-preview';
// 					colorPreview.style.backgroundColor = `#${color.value}`;
// 					colorPreview.addEventListener('click', () => {
// 							onColorClicked(color.value);
// 					});
// 					li.appendChild(colorPreview);

// 					const input = document.createElement('input');
// 					input.className = 'color-input';
// 					input.type = 'text';
// 					input.value = color.value;
// 					input.addEventListener('change', (e) => {
// 							const value = e.target.value;
// 							if (!value) {
// 									// Treat empty value as delete
// 									colors.splice(colors.indexOf(color), 1);
// 							} else {
// 									color.value = value;
// 							}
// 							updateColorList(colors);
// 					});
// 					li.appendChild(input);

// 					ul.appendChild(li);
// 			}

// 			// Update the saved state
// 			vscode.setState({ colors: colors });
// 	}

// 	/** 
// 	 * @param {string} color 
// 	 */
// 	function onColorClicked(color) {
// 			vscode.postMessage({ type: 'colorSelected', value: color });
// 	}

// 	/**
// 	 * @returns string
// 	 */
// 	function getNewCalicoColor() {
// 			const colors = ['020202', 'f1eeee', 'a85b20', 'daab70', 'efcb99'];
// 			return colors[Math.floor(Math.random() * colors.length)];
// 	}

// 	function addColor() {
// 			colors.push({ value: getNewCalicoColor() });
// 			updateColorList(colors);
// 	}
// }());


