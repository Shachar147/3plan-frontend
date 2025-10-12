import axios from 'axios';
import { getTinderServerAddress, isDev } from '../../config/config';
import { endpoints } from '../../v2/utils/endpoints';

const unAuthorizedRoutes = ['signin'];

async function login(serverAddress?: string) {
	const username = 'triplan';
	const password = 'Aa783c0fc5-e574-bfee';

	const result: any = await _apiPost(endpoints.v1.auth.signIn, { username, password }, undefined, serverAddress);
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

export async function apiPost(url: string, data: any, serverAddress?: string) {
	const accessToken = await login(serverAddress);
	return _apiPost(url, data, accessToken, serverAddress);
}

export async function apiPut(url: string, data: any) {
	const accessToken = await login();
	return _apiPut(url, data, accessToken);
}

export async function apiDelete(url: string) {
	const accessToken = await login();
	return _apiDelete(url, accessToken);
}

function _apiGet(url: string, accessToken: string) {
	if (!accessToken) {
		window.location.href = '/login';
		return;
	}
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

function getBaseHeaders() {
	if (isDev()) {
		return {
			'Access-Control-Allow-Origin': '*',
		};
	}
	return {};
}

function _apiPost(url: string, data: any, accessToken?: string, serverAddress: string = getTinderServerAddress()) {
	return axios
		.post(serverAddress + url, data, {
			headers: {
				...getBaseHeaders(),
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

function _apiPut(url: string, data: any, accessToken?: string) {
	return axios
		.put(getTinderServerAddress() + url, data, {
			headers: {
				...getBaseHeaders(),
				Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
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

function _apiDelete(url: string, accessToken?: string) {
	return axios
		.delete(getTinderServerAddress() + url, {
			headers: {
				...getBaseHeaders(),
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
