// ProtectedRoute.jsx
import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../pages/admin/Context/AuthContext";

export default function ProtectedRoute({ children, requireSuper = false }) {
  const {
    adminLoggedIn,
    isSuper,
    loading,
  } = useContext(AuthContext);

  

  // Still loading → show splash
  if (loading) return <div>Loading...</div>;

  // If admin not logged in → go to login page
  if (!adminLoggedIn) return <Navigate to="/admin/login" replace />;

  // If requires super and not super admin → block access
  if (requireSuper && !isSuper) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
