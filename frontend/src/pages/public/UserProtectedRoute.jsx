// src/components/UserProtectedRoute.jsx
import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../admin/Context/AuthContext";

export default function UserProtectedRoute({ children }) {
  const { userLoggedIn, loading, fetchUser } = useContext(AuthContext);

  // ✅ Check session only for protected pages
  // UserProtectedRoute.jsx
  useEffect(() => {
    if (!userLoggedIn) {
      fetchUser();
    }
  }, [userLoggedIn]);

  if (loading) {
    return <div>Checking user session...</div>;
  }

  if (!userLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
