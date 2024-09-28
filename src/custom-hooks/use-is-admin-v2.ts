import { useEffect } from 'react';
import { apiPost } from '../helpers/api';
import {endpoints} from "../v2/utils/endpoints";

const useIsAdminV2 = () => {
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                await apiPost(endpoints.v1.auth.isAdmin, {}, false);
                return true // all good
            } catch {
                window.location.href = '/';
                return false; // not an admin
            }
        };
        checkAdminStatus();
    }, []);
};

export default useIsAdminV2;
