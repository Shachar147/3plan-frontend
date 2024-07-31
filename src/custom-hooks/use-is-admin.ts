import { useState, useEffect } from 'react';
import { apiPost } from '../helpers/api';
import {endpoints} from "../v2/utils/endpoints";

const useIsAdmin = () => {
	const [isAdmin, setIsAdmin] = useState(false);

	function updateBodyClass() {
		if (window.location.href.indexOf('admin') !== -1) {
			document.querySelector('body')?.classList.add('admin-side');
		} else {
			document.querySelector('body')?.classList.remove('admin-side');
		}
	}

	useEffect(() => {
		const checkAdminStatus = async () => {
			try {
				await apiPost(endpoints.v1.auth.isAdmin, {}, false);
				setIsAdmin(true);
			} catch {
				setIsAdmin(false);
			}
		};
		updateBodyClass();
		checkAdminStatus();
	}, []);

	return isAdmin;
};

export default useIsAdmin;
