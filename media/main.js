let doCredentialsExist = false;
const vscode = acquireVsCodeApi();

const runAtStart = () => {

	vscode.postMessage( { type: 'initiate' } );

	window.addEventListener( 'message', event => {
		const message = event.data;
		vscode.postMessage( { type: 'logAppend', log: JSON.stringify( message ) } );
		if ( message.type === 'credentialExistence' ) { credentialsChanged( message.exist ); }
	} );


	// setInterval( () => {
	// 	vscode.postMessage( { type: 'logAppend', log: doCredentialsExist } );
	// }, 1000 );

	document.querySelector( '#buttonClearCredentials' ).addEventListener( 'click', clearCredentials );
	document.querySelector( '#buttonTNPCredentialsSubmit' ).addEventListener( 'click', saveCredentials );
	document.querySelector( '#buttonAddSecret' ).addEventListener( 'click', addCredentialSecret );
};

const credentialsChanged = async ( payload ) => {
	doCredentialsExist = !!payload;
	vscode.postMessage( { type: 'logAppend', log: 'credentialsChanged' } );
	vscode.postMessage( { type: 'logAppend', log: doCredentialsExist } );
	if ( doCredentialsExist ) {
		document.querySelector( '#credentialContainer' ).className = 'is-hidden';
		document.querySelector( '#buttonClearCredentials' ).className = '';
	} else {
		document.querySelector( '#credentialContainer' ).className = '';
		document.querySelector( '#buttonClearCredentials' ).className = 'is-hidden';
	}
};

const saveCredentials = () => {
	const key = document.querySelector( '#apiCredKey' ).value;
	const secret = document.querySelector( '#apiCredSecret' ).value;
	vscode.postMessage( { type: 'saveCredentials', values: { key, secret } } );
};
const clearCredentials = () => { vscode.postMessage( { type: 'clearCredentials' } ); };

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


