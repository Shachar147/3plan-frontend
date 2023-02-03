import axios from 'axios';
import { getServerAddress } from '../config/config';

export function apiGet(self, url, onSuccess, onError, onFinish) {
	return axios
		.get(getServerAddress() + url)
		.then((res) => {
			onSuccess && onSuccess(res);
			return res;
		})
		.catch(function (error) {
			handleUnauthorizedError(error).then((isRedirected) => {
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
		handleUnauthorizedError(error);
	});
}

async function handleUnauthorizedError(error) {
	if (error?.response?.status === 401) {
		window.location.href = '/login';
		return true;
	}
	return false;
}

export function apiPost(self, url, data, onSuccess, onError, onFinish) {
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
			handleUnauthorizedError(error).then((isRedirected) => {
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

export function apiPut(self, url, data, onSuccess, onError, onFinish) {
	const httpClient = axios.create();
	httpClient.defaults.timeout = 600000;

	httpClient
		.put(getServerAddress() + url, data, {
			timeout: 600000,
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
		.then((res) => {
			onSuccess(res);
		})
		.catch(function (error) {
			handleUnauthorizedError(error).then((isRedirected) => {
				if (!isRedirected) {
					onError(error, () => {
						self.setState({ error: '' });
						apiPut(self, url, data, onSuccess, onError, onFinish);
					});
				}
			});
		})
		.then(function () {
			onFinish();
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
			handleUnauthorizedError(error).then((isRedirected) => {
				if (!isRedirected) {
					onError(error, () => {
						self.setState({ error: '' });
						apiPut(self, url, data, onSuccess, onError, onFinish);
					});
				}
			});
		})
		.then(function () {
			onFinish();
		});
}
