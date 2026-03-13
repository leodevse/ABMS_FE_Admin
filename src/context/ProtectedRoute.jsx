import React, { Children } from 'react'
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({children}) => {
    const {user} = useAuth();
    const location = useLocation();
    if(!user){
        console.log("user.... is null");
        console.log(location.pathname);
        return <Navigate to="/login" state={{from: location}} replace/>
    }
  return children;
}

export default ProtectedRoute
