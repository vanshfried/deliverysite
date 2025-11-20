import React,{ useEffect, useState } from "react";
import { storeOwnerMe } from "../api/storeOwner";
import { Navigate } from "react-router-dom";

export default function StoreOwnerProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await storeOwnerMe();

      if (res?.data?.owner) {
        setAllowed(true);
      } else {
        setAllowed(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!allowed) return <Navigate to="/store-owner/login" replace />;

  return children;
}
