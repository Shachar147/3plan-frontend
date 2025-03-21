export function getParameterFromHash(paramName: string) {
	// Get the hash from the window location
	let hash = window.location.hash; // "#param=value"

	// Remove the '#' character
	if (hash.startsWith('#')) {
		hash = hash.substring(1); // "param=value"
	}

	if (hash.includes('?')) {
		hash = hash.split('?')[1];
	}

	// Split the hash into key-value pairs
	let params = hash.split('&'); // ["param=value"]

	// Create an object to hold the parameters
	let hashParams: Record<string, any> = {};

	// Loop through each key-value pair
	params.forEach((param) => {
		let [key, value] = param.split('=');
		hashParams[key] = value ? decodeURIComponent(value) : undefined;
	});

	return hashParams[paramName];
}
