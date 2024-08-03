// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element: Component, ...rest }) => {
    const token = localStorage.getItem('authToken');
    console.log(token)
    return token ? <Component {...rest} /> : <Navigate to="/login" />;
};

export default ProtectedRoute;