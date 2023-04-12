export function getServerAddress() {
	const mode = process.env.REACT_APP_MODE || process.env.STORYBOOK_APP_MODE;
	if (mode && mode.trim() === 'development') {
		// return 'http://192.168.1.25:3001';
		// return 'http://192.168.1.83:3001';
		// return 'http://localhost:3001';
		return 'http://192.168.1.30:3001';
		// return 'https://triplan-server.herokuapp.com';
	} else {
		return 'https://triplan-server.herokuapp.com';
	}
}

// todo: check that it'll work on heroku (!!)
export function getWebSocketsServerAddress() {
	return getServerAddress().replace('http://', 'ws://').replace('https://', 'wss://');
}

export function getTinderServerAddress() {
	const mode = process.env.REACT_APP_MODE || process.env.STORYBOOK_APP_MODE;
	if (mode && mode.trim() === 'development') {
		return 'http://localhost:5555';
	} else {
		// return 'https://triplan-server.herokuapp.com';
		return 'http://localhost:5555';
	}
}
