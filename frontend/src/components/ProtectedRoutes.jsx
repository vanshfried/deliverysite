import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../pages/admin/Context/AuthContext";

export default function ProtectedRoute({ children, requireSuper = false }) {
  const { adminLoggedIn, isSuper, loading, fetchAdmin } =
    useContext(AuthContext);

  // ✅ Fetch admin session only inside admin protected pages
  useEffect(() => {
  if (!adminLoggedIn) {
    fetchAdmin();
  }
}, [adminLoggedIn]);


  if (loading) return <div>Checking Authentication...</div>;

  if (!adminLoggedIn) return <Navigate to="/admin/login" replace />;

  if (requireSuper && !isSuper)
    return <Navigate to="/admin/dashboard" replace />;

  return children;
}
