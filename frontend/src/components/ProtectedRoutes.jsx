// ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../pages/admin/Context/AuthContext";

export default function ProtectedRoute({ children, requireSuper = false }) {
  const { adminLoggedIn, isSuper, loading } = useContext(AuthContext);

  // ✅ Session still checking → avoid incorrect redirect
  if (loading) return <div>Checking Authentication...</div>;

  // ✅ Not logged in → send to admin login
  if (!adminLoggedIn) return <Navigate to="/admin/login" replace />;

  // ✅ Superadmin restriction
  if (requireSuper && !isSuper) {
    return (
      <Navigate 
        to="/admin/dashboard" 
        replace 
        state={{ error: "Not authorized" }}
      />
    );
  }

  // ✅ Authenticated and allowed → show the page
  return children;
}
