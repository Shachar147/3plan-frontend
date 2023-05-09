import { useState, useEffect } from 'react';
import { apiPost } from '../helpers/api';

const useIsAdmin = () => {
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		const checkAdminStatus = async () => {
			try {
				await apiPost('/auth/isAdmin', {}, false);
				setIsAdmin(true);
			} catch {
				setIsAdmin(false);
			}
		};
		checkAdminStatus();
	}, []);

	return isAdmin;
};

export default useIsAdmin;
