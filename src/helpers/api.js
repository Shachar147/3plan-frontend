import axios from 'axios';
import { getServerAddress } from '../config/config';

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

export function apiGetPromise(self, url, handleUnAuthorized = true) {
	return axios.get(getServerAddress() + url).catch((error) => {
		if (handleUnAuthorized) {
			handleUnauthorizedError(error, url);
		}
	});
}

async function handleUnauthorizedError(error, url, redirectUnautirhized = true) {
	if (error?.response?.status === 401) {
		if (redirectUnautirhized) {
			if (!unAuthorizedRoutes.find((route) => url.indexOf(route) !== -1)) {
				window.location.href = '/login';
			}
			return true;
		}
	}
	return false;
}

export async function apiGetNew(url, data) {
	return await axios
		.get(getServerAddress() + url, {
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
		.then((res) => {
			return res;
		})
		.catch(async (error) => {
			const isUnauthorized = await handleUnauthorizedError(error, url);
			if (!isUnauthorized) {
				throw error;
			}
			return error;
		});
}

export async function apiPost(url, data, redirectUnauthorized = true, onSuccess = () => {}, onError = () => {}) {
	return await axios
		.post(getServerAddress() + url, data, {
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
		.then((res) => {
			if (onSuccess) {
				onSuccess();
			}
			return res;
		})
		.catch(async (error) => {
			if (onError) {
				onError();
			}

			const isUnauthorized = await handleUnauthorizedError(error, url, redirectUnauthorized);
			if (!isUnauthorized) {
				throw error;
			}
			return error;
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
		});
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
					});
				}
			});
		})
		.then(function () {
			onFinish();
		});
}
