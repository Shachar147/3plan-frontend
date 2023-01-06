import Cookies from 'js-cookie';
import { isDefined } from '../utils/utils';
import { apiPost } from './api';
import jwtDecode from 'jwt-decode';

export function setToken(token) {
	Cookies.set('token', token);
}

export function getToken() {
	return Cookies.get('token');
}

export function getUser() {
	const token = getToken();
	if (token) {
		const decodedPayload = jwtDecode(token);
		return decodedPayload.username;
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
	//             console.log(error);
	//             // if (error.message.indexOf("401") !== -1) {
	//             //     isLoggedOn = false;
	//             // }
	//             debugger;
	//             isLoggedOn = false;
	//         },
	//         function() {
	//         }
	//     );
	//
	//     debugger;
	//     return isLoggedOn;
	// }
	//
	// return false;

	// todo complete - check that token is valid, and not expired
	return isDefined(Cookies.get('token')) && Cookies.get('token') !== '';
}
