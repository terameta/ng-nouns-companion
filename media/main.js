const vscode = acquireVsCodeApi();

const log = ( payload ) => {
	let toLog = payload;
	if ( typeof payload !== 'string' ) {
		toLog = JSON.stringify( payload );
	}
	vscode.postMessage( { type: 'logAppend', log: toLog } );
};

let state = { credentials: { key: '', secret: '' } };

let currentSearchPhrase = '';

let mainTabListDE;
let mainTabListCC;

const runAtStart = () => {

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

	vscode.postMessage( { type: 'askState' } );

	mainTabListDE = document.querySelectorAll( '.tabli' );
	mainTabListCC = document.querySelectorAll( '.tabcc' );

	prepareTabLIs();

	activateTab( 'tcc-e' );
	// activateTab('tabLabelExisting');
};

const prepareTabLIs = () => {
	for ( const node of mainTabListDE ) {
		if ( node.className.indexOf( 'tcc-e' ) >= 0 ) {
			node.addEventListener( 'click', () => { activateTab( 'tcc-e' ); } );
		}
		if ( node.className.indexOf( 'tcc-s' ) >= 0 ) {
			node.addEventListener( 'click', () => { activateTab( 'tcc-s' ); } );
		}
		if ( node.className.indexOf( 'tcc-c' ) >= 0 ) {
			node.addEventListener( 'click', () => { activateTab( 'tcc-c' ); } );
		}
	}
};

const activateTab = ( tabId ) => {
	for ( const node of mainTabListDE ) {
		if ( node.className.indexOf( tabId ) >= 0 ) {
			node.classList.add( 'is-active' );
		} else {
			node.classList.remove( 'is-active' );
		}
	}

	for ( const node of mainTabListCC ) {
		if ( node.className.indexOf( tabId ) >= 0 ) {
			node.classList.remove( 'is-hidden' );
		} else {
			node.classList.add( 'is-hidden' );
		}
	}
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
	const searcher = document.querySelector( '#inputSearchRemote' );
	const iconList = document.querySelector( '#icon-list' );
	log( searcher.value );
	if ( searcher && searcher.value && typeof searcher.value === 'string' && searcher.value.length >= 1 ) {
		currentSearchPhrase = searcher.value;
		iconList.textContent = 'Searching, please wait';
		vscode.postMessage( { type: 'search', query: searcher.value } );
	} else {
		iconList.textContent = 'Please enter a value at least 1 character long';
	}
};

const searchResult = async ( payload ) => {
	const iconListDiv = document.querySelector( '#icon-list' );
	iconListDiv.textContent = '';
	const icons = payload.icons;
	for ( const icon of icons ) {
		const iconDiv = document.createElement( 'div' );
		iconDiv.className = 'box';
		iconDiv.classList.add( 'is-small' );
		iconDiv.classList.add( 'py-2' );
		iconDiv.classList.add( 'my-1' );
		const iconImg = document.createElement( 'img' );
		iconImg.src = icon.preview_url_84;
		log( icon.preview_url_84 );
		log( iconImg.src );
		iconImg.width = '16';
		iconImg.height = '16';
		iconImg.className = 'mr-2';
		const iconNameLabel = document.createElement( 'label' );
		iconNameLabel.innerHTML = 'Icon Name';
		const iconNameBox = document.createElement( 'input' );
		iconNameBox.type = 'text';
		iconNameBox.id = `icon${ icon.id }name`;
		iconNameBox.value = currentSearchPhrase;
		iconNameBox.className = 'mr-2';
		const iconBtn = document.createElement( 'button' );
		iconBtn.innerHTML = 'Save';
		iconBtn.addEventListener( 'click', () => { downloadIcon( icon ); } );
		// iconDiv.innerHTML = `<img src="${ icon.preview_url_84 }" width="16px" height="16px" class="mr-2" />`;
		// iconDiv.innerHTML += `<input type="text" id="icon${ icon.id }name" value="${ currentSearchPhrase }" class="mr-2">`;
		// iconDiv.innerHTML += `<button type="button" onclick="downloadIcon(${ icon.id })">Save</button>`;
		iconDiv.appendChild( iconImg );
		iconDiv.appendChild( iconNameLabel );
		iconDiv.appendChild( iconNameBox );
		iconDiv.appendChild( iconBtn );
		// iconDiv.addEventListener( 'click', () => {
		// 	downloadIcon( icon.id );
		// } );
		iconListDiv.appendChild( iconDiv );
		// log( icon );
	}
	log( 'We received this many icons:' + icons.length );
	// log( icons.length + '<<<<<' );
};

const downloadIcon = async ( payload ) => {
	// log( payload );
	const nameInput = document.querySelector( `#icon${ payload.id }name` );
	// log( nameInput.value );
	vscode.postMessage( { type: 'downloadButton', values: { saveName: nameInput.value, icon: payload } } );
};

const saveCredentials = async () => {
	const key = document.querySelector( '#apiCredKey' ).value;
	const secret = document.querySelector( '#apiCredSecret' ).value;
	vscode.postMessage( { type: 'credentialSave', values: { key, secret } } );
};

const clearCredentials = async () => {
	log( 'Clear credentials sending' );
	vscode.postMessage( { type: 'credentialClear' } );
};

const receiveState = async ( payload ) => {
	log( 'State Received' );
	state = payload;
	await checkCredentials();
	await updateIconList();
};

const updateIconList = async () => {
	const iconListDiv = document.querySelector( '#existing-icons' );
	iconListDiv.innerHTML = '';
	const iconListUL = document.createElement( 'ul' );
	iconListDiv.appendChild( iconListUL );
	for ( const icon of state.icons ) {
		const iconDiv = document.createElement( 'li' );
		iconDiv.className = 'box';
		iconDiv.classList.add( 'is-small' );
		iconDiv.classList.add( 'py-2' );
		iconDiv.classList.add( 'my-1' );
		iconDiv.innerHTML = icon.data;
		iconDiv.innerHTML += icon.name;
		iconListUL.appendChild( iconDiv );
		const svgElem = iconDiv.querySelector( 'svg' );
		svgElem.style.width = '1rem';
		svgElem.style.height = '1rem';
		// svgElem.style.border = '1px solid black';
		svgElem.style.marginRight = '1rem';
	}
};

const activateCredentials = () => {
	log( 'Credential activation requested' );
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


