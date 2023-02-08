import axios from 'axios';
import { getTinderServerAddress } from '../../config/config';

const unAuthorizedRoutes = ['signin'];

async function login() {
	const username = 'triplan';
	const password = 'Aa783c0fc5-e574-bfee';

	const result: any = await _apiPost('/auth/signin', { username, password });
	return result?.data?.accessToken;
}

export async function apiGet(url: string) {
	const accessToken = await login();
	return _apiGet(url, accessToken);
}

async function handleUnauthorizedError(error: any, url: string) {
	if (error?.response?.status === 401) {
		if (!unAuthorizedRoutes.find((route) => url.indexOf(route) !== -1)) {
			window.location.href = '/login';
			return true;
		}
	}
	return false;
}

export async function apiPost(url: string, data: any) {
	const accessToken = await login();
	return _apiPost(url, data, accessToken);
}

export function apiPut(url: string, data: any) {
	const httpClient = axios.create();
	httpClient.defaults.timeout = 600000;

	httpClient
		.put(getTinderServerAddress() + url, data, {
			timeout: 600000,
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
		.then((res) => {
			return res;
		})
		.catch(function (error) {
			handleUnauthorizedError(error, url).then((isRedirected) => {});
		});
}

export function apiDelete(url: string) {
	const httpClient = axios.create();
	httpClient.defaults.timeout = 600000;

	httpClient
		.delete(getTinderServerAddress() + url, {
			timeout: 600000,
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
		.then((res) => {
			return res;
		})
		.catch(function (error) {
			handleUnauthorizedError(error, url).then((isRedirected) => {});
		});
}

function _apiGet(url: string, accessToken: string) {
	return axios
		.get(getTinderServerAddress() + url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})
		.then((res) => {
			return res;
		})
		.catch((error) => {
			handleUnauthorizedError(error, url).then((isRedirected) => {});
			return null;
		});
}

function _apiPost(url: string, data: any, accessToken?: string) {
	return axios
		.post(getTinderServerAddress() + url, data, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
			},
		})
		.then((res) => {
			return res;
		})
		.catch(function (error) {
			handleUnauthorizedError(error, url).then((isRedirected) => {});
			return null;
		});
}
