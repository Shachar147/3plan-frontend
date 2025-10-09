export const withPlacesFinder = false; // disabled for now

export function getServerAddress() {
	const mode = process.env.REACT_APP_MODE || process.env.STORYBOOK_APP_MODE;
	if (mode && mode.trim() === 'development') {
		// return 'http://192.168.1.25:3001'; // Tel Aviv
		// return 'http://192.168.1.83:3001'; // Nesher
		// return 'http://192.168.1.20:3001'; // Nesher
		// return 'http://192.168.1.180:3001'; // Nesher
		// return 'http://192.168.1.150:3001';
		return 'http://localhost:3001';
		// return 'http://172.20.10.3:3001'; // Chen&Erez
		// return 'http://192.168.1.30:3001'; // Hadera
		// return 'https://triplan-server.herokuapp.com';
	} else {
		// return 'https://triplan-server.herokuapp.com';
		return 'https://threeplan-server.onrender.com';
	}
}

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
