import React, { useEffect } from "react";
import {setToken} from "../../helpers/auth";
import { Navigate } from 'react-router'

const LogoutPage = () => {
    useEffect(() => {
        setToken("");
    }, [])

    return <Navigate to="/login" />;
};

export default LogoutPage;