// @ts-ignore
import Cookies from 'js-cookie';
import { isDefined } from '../utils/utils';
import jwtDecode from 'jwt-decode';

export function setToken(token: string) {
	Cookies.set('token', token);
}

export function getToken() {
	return Cookies.get('token');
}

export function getUser() {
	const token = getToken();
	if (token) {
		const decodedPayload: { username?: string } = jwtDecode(token);
		return decodedPayload.username;
	}
	return undefined;
}

export function getUserId() {
	const token = getToken();
	if (token) {
		const decodedPayload: { id?: string } = jwtDecode(token);
		return decodedPayload.id;
	}
	return undefined;
}

export function isLoggedOn() {
	// if (isDefined(Cookies.get('token')) && Cookies.get('token') !== ""){
	//     let isLoggedOn = true;
	//
	//     apiPost(this,
	//         `/auth/test`,
	//         {},
	//         function(res) {
	//         },
	//         function(error) {
	//             // if (error.message.indexOf("401") !== -1) {
	//             //     isLoggedOn = false;
	//             // }
	//             isLoggedOn = false;
	//         },
	//         function() {
	//         }
	//     );
	//
	//     return isLoggedOn;
	// }
	//
	// return false;

	// todo complete - check that token is valid, and not expired
	return isDefined(Cookies.get('token')) && Cookies.get('token') !== '';
}
