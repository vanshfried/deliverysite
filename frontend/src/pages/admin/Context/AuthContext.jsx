import React, { createContext, useState, useEffect } from "react";
import API, { setUserLoggedInFlag } from "../../../api/api.js";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [isSuper, setIsSuper] = useState(false);
  const [loading, setLoading] = useState(true);

  // Only attempt API calls if we suspect user might be logged in
  const fetchUser = async () => {
    if (!document.cookie.includes("session")) return; // skip if no session cookie
    try {
      const res = await API.get("/users/me");
      setUserLoggedIn(true);
      setUser(res.data.user);
      setUserLoggedInFlag(true); // tell API interceptor user is logged in
    } catch {
      setUserLoggedIn(false);
      setUser(null);
      setUserLoggedInFlag(false);
    }
  };

  const fetchAdmin = async () => {
    if (!document.cookie.includes("adminSession")) return; // skip if no admin session
    try {
      const res = await API.get("/admin/me");
      setAdminLoggedIn(true);
      setAdmin(res.data.admin);
      setIsSuper(res.data.admin.isSuper);
      setUserLoggedInFlag(true);
    } catch {
      setAdminLoggedIn(false);
      setAdmin(null);
      setIsSuper(false);
      setUserLoggedInFlag(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([fetchUser(), fetchAdmin()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userLoggedIn,
        setUserLoggedIn,
        user,
        setUser,
        adminLoggedIn,
        setAdminLoggedIn,
        admin,
        setAdmin,
        isSuper,
        setIsSuper,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
