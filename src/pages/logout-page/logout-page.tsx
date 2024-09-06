import React, { useEffect } from 'react';
import { setToken } from '../../helpers/auth';
import { Navigate } from 'react-router';
import {FeatureFlagsService} from "../../utils/feature-flags";
import {newDesignRootPath} from "../../v2/utils/consts";

const LogoutPage = () => {
	useEffect(() => {
		setToken('');
	}, []);

	return <Navigate to={FeatureFlagsService.isNewDesignEnabled(true) ? `${newDesignRootPath}/login` : "/login"} />;
};

export default LogoutPage;
