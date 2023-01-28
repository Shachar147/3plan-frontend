export function getServerAddress() {
	const mode = process.env.REACT_APP_MODE || process.env.STORYBOOK_APP_MODE;
	if (mode && mode.trim() === 'development') {
		return 'http://192.168.1.153:3001';
		// return 'http://localhost:3001';
		// return 'https://triplan-server.herokuapp.com';
	} else {
		return 'https://triplan-server.herokuapp.com';
	}
}
