// AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import API from "../../../api/api.js";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [isSuper, setIsSuper] = useState(false);

  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await API.get("/users/me");
      setUserLoggedIn(true);
      setUser(res.data.user);
    } catch (error) {
      if (error.response?.status !== 401) console.error(error);
      setUserLoggedIn(false);
      setUser(null);
    }
  };

  const fetchAdmin = async () => {
    try {
      const res = await API.get("/admin/me");
      setAdminLoggedIn(true);
      setAdmin(res.data.admin);
      setIsSuper(res.data.admin.isSuper);
    } catch (error) {
      if (error.response?.status !== 401) console.error(error);
      setAdminLoggedIn(false);
      setAdmin(null);
      setIsSuper(false);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      const hasUserToken = document.cookie.includes("userToken");
      const hasAdminToken = document.cookie.includes("adminToken");

      // ✅ No tokens => skip requests
      if (!hasUserToken && !hasAdminToken) {
        setLoading(false);
        return;
      }

      try {
        const tasks = [];
        if (hasUserToken) tasks.push(fetchUser());
        if (hasAdminToken) tasks.push(fetchAdmin());
        await Promise.all(tasks);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
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
