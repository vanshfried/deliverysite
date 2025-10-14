import React, { createContext, useState, useEffect } from "react";
import API from "../../../api/api.js";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSuper, setIsSuper] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true); // new loading state

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/admin/me");
        setIsLoggedIn(true);
        setIsSuper(res.data.admin.isSuper);
        setAdmin(res.data.admin);
      } catch {
        setIsLoggedIn(false);
        setIsSuper(false);
        setAdmin(null);
      } finally {
        setLoading(false); // finished fetching
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, setIsLoggedIn, isSuper, setIsSuper, admin, setAdmin, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
