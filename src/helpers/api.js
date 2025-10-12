import axios from 'axios';
import { getServerAddress, isDev } from '../config/config';

const unAuthorizedRoutes = ['signin'];

export function apiGet(self, url, onSuccess, onError, onFinish, isRemote = false) {
	return axios
		.get(getServerAddress(isRemote) + url)
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

export function apiGetPromise(self, url, handleUnAuthorized = true, isRemote = false) {
	return axios.get(getServerAddress(isRemote) + url).catch((error) => {
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

export async function apiGetNew(url, isRemote = false, throwOnError = true) {
	return await axios
		.get(getServerAddress(isRemote) + url, {
			headers: getBaseHeaders(),
		})
		.then((res) => {
			return res;
		})
		.catch(async (error) => {
			if (throwOnError) {
				const isUnauthorized = await handleUnauthorizedError(error, url);
				if (!isUnauthorized) {
					throw error;
				}
			}
			return error;
		});
}

function getBaseHeaders() {
	if (isDev()) {
		return {
			'Access-Control-Allow-Origin': '*',
		};
	}
	return {};
}

export async function apiPost(
	url,
	data,
	redirectUnauthorized = true,
	onSuccess = () => {},
	onError = () => {},
	isRemote = false
) {
	return await axios
		.post(getServerAddress(isRemote) + url, data, {
			headers: getBaseHeaders(),
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
export function apiPostWithCallback(url, data, onSuccess, onError, onFinish, isRemote = false) {
	axios
		.post(getServerAddress(isRemote) + url, data, {
			headers: getBaseHeaders(),
		})
		.then((res) => {
			onSuccess(res);
		})
		.catch(function (error) {
			handleUnauthorizedError(error, url).then((isRedirected) => {
				if (!isRedirected) {
					onError(error, () => {
						apiPost(null, url, data, onSuccess, onError, onFinish);
					});
				}
			});
		})
		.then(function () {
			onFinish();
		});
}

export function apiPut(url, data, onSuccess, onError, onFinish, isRemote = false) {
	return axios
		.put(getServerAddress(isRemote) + url, data, {
			headers: getBaseHeaders(),
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

export async function apiDeletePromise(url, isRemote = false) {
	return await axios.delete(getServerAddress(isRemote) + url, {
		headers: getBaseHeaders(),
	});
}

export function apiDelete(self, url, onSuccess, onError, onFinish, isRemote = false) {
	const httpClient = axios.create();
	httpClient.defaults.timeout = 600000;

	httpClient
		.delete(
			getServerAddress(isRemote) + url,
			{},
			{
				timeout: 600000,
				headers: getBaseHeaders(),
			}
		)
		.then((res) => {
			onSuccess(res);
		})
		.catch(function (error) {
			handleUnauthorizedError(error, url).then((isRedirected) => {
				if (!isRedirected) {
					onError?.(error, () => {
						self.setState({ error: '' });
					});
				}
			});
		})
		.then(function () {
			onFinish?.();
		});
}
