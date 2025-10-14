// ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../api/api";

export default function ProtectedRoute({ children, requireSuper = false }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await API.get("/admin/me"); // fetch user info
        const isSuper = res.data.admin.isSuper;

        // If route requires super, allow only super admins
        // Otherwise, allow any authenticated admin
        if (!requireSuper || isSuper) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setHasAccess(false); // unauthorized
        } else {
          setError("Network error. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requireSuper]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!hasAccess) return <Navigate to="/admin/login" replace />;

  return children;
}
