import axios from 'axios';
import { getServerAddress, getTinderServerAddress } from '../config/config';

const unAuthorizedRoutes = ['signin'];

export function apiGet(self, url, onSuccess, onError, onFinish) {
	return axios
		.get(getServerAddress() + url)
		.then((res) => {
			onSuccess && onSuccess(res);
			return res;
		})
		.catch(function (error) {
			handleUnauthorizedError(error, url).then((isRedirected) => {
				if (!isRedirected) {
					onError(error, () => {
						self.setState({ error: '' });
						apiGet(self, url, onSuccess, onError, onFinish);
					});
				}
			});
		})
		.then(function () {
			onFinish();
		});
}

export function apiGetPromise(self, url) {
	return axios.get(getServerAddress() + url).catch((error) => {
		handleUnauthorizedError(error, url);
	});
}

async function handleUnauthorizedError(error, url) {
	if (error?.response?.status === 401) {
		if (!unAuthorizedRoutes.find((route) => url.indexOf(route) !== -1)) {
			window.location.href = '/login';
			return true;
		}
	}
	return false;
}

export async function apiPost(url, data) {
	return await axios
		.post(getServerAddress() + url, data, {
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
		.then((res) => {
			return res;
		})
		.catch(function (error) {
			if (!handleUnauthorizedError(error, url).then((isRedirected) => {})) {
				throw error;
			}
			// return null;
		});
}
export function apiPostWithCallback(url, data, onSuccess, onError, onFinish) {
	axios
		.post(getServerAddress() + url, data, {
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
		.then((res) => {
			onSuccess(res);
		})
		.catch(function (error) {
			handleUnauthorizedError(error, url).then((isRedirected) => {
				if (!isRedirected) {
					onError(error, () => {
						self.setState({ error: '' });
						apiPost(self, url, data, onSuccess, onError, onFinish);
					});
				}
			});
		})
		.then(function () {
			onFinish();
		});
}

export function apiPut(url, data, onSuccess, onError, onFinish) {
	return axios
		.put(getServerAddress() + url, data, {
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
		.then((res) => {
			return res;
		})
		.catch(function (error) {
			if (!handleUnauthorizedError(error, url).then((isRedirected) => {})) {
				throw error;
			}
			// return null;
		});

	// const httpClient = axios.create();
	// httpClient.defaults.timeout = 600000;
	//
	// httpClient
	// 	.put(getServerAddress() + url, data, {
	// 		timeout: 600000,
	// 		headers: {
	// 			'Access-Control-Allow-Origin': '*',
	// 		},
	// 	})
	// 	.then((res) => {
	// 		onSuccess(res);
	// 	})
	// 	.catch(function (error) {
	// 		handleUnauthorizedError(error, url).then((isRedirected) => {
	// 			if (!isRedirected) {
	// 				onError(error, () => {
	// 					self.setState({ error: '' });
	// 					apiPut(self, url, data, onSuccess, onError, onFinish);
	// 				});
	// 			}
	// 		});
	// 	})
	// 	.then(function () {
	// 		onFinish();
	// 	});
}

export function apiDelete(self, url, onSuccess, onError, onFinish) {
	const httpClient = axios.create();
	httpClient.defaults.timeout = 600000;

	httpClient
		.delete(
			getServerAddress() + url,
			{},
			{
				timeout: 600000,
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
		)
		.then((res) => {
			onSuccess(res);
		})
		.catch(function (error) {
			handleUnauthorizedError(error, url).then((isRedirected) => {
				if (!isRedirected) {
					onError(error, () => {
						self.setState({ error: '' });
						// apiPut(self, url, data, onSuccess, onError, onFinish);
					});
				}
			});
		})
		.then(function () {
			onFinish();
		});
}
