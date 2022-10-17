// This is used to determine if a user is authenticated and
// if they are allowed to visit the page they navigated to.

// If they are: they proceed to the page
// If not: they are redirected to the login page.
import React from 'react'
import { Route, Navigate, Outlet } from 'react-router-dom'
import { isLoggedOn } from "./helpers/auth";



const PrivateRoute = () => {
    const isLoggedIn = isLoggedOn();

    // If authorized, return an outlet that will render child elements
    // If not, return element that will navigate to login page
    return isLoggedIn ? <Outlet/> : <Navigate to="/login" />;
}




// const PrivateRoute = ({ component: Component, data, ...rest }) => {
//
//     const isLoggedIn = isLoggedOn();
//
//     return (
//         <Route
//             {...rest}
//             render={props =>
//                 isLoggedIn ? (
//                     <Component {...props} {...data} />
//                 ) : (
//                     <Navigate to={{ pathname: '/login', state: { from: props.location } }} />
//                 )
//             }
//         />
//     )
// }

export default PrivateRoute;