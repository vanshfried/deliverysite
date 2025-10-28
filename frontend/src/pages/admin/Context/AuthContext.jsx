import React, { createContext, useState, useEffect } from "react";
import API, { setUserLoggedInFlag } from "../../../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [user, setUser] = useState(null);

  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const hasUserCookie = () => document.cookie.includes("userToken=");
  const hasAdminCookie = () => document.cookie.includes("adminToken=");

  // ✅ Fetch admin session
  const fetchAdmin = async () => {
    try {
      const res = await API.get("/admin/me");
      setAdmin(res.data.admin);
      setAdminLoggedIn(true);
    } catch (err) {
      if (err.response?.status !== 401) console.error("Admin fetch failed", err);
      setAdmin(null);
      setAdminLoggedIn(false);
    }
  };

  // ✅ Fetch user session
  const fetchUser = async () => {
    try {
      const res = await API.get("/users/me");
      setUser(res.data.user);
      setUserLoggedIn(true);
      setUserLoggedInFlag(true);
    } catch (err) {
      if (err.response?.status !== 401) console.error("User fetch failed", err);
      setUser(null);
      setUserLoggedIn(false);
      setUserLoggedInFlag(false);
    }
  };

  // ✅ Restore sessions only if relevant cookies exist
  useEffect(() => {
    const restore = async () => {
      const promises = [];
      if (hasAdminCookie()) promises.push(fetchAdmin());
      if (hasUserCookie()) promises.push(fetchUser());

      await Promise.all(promises);
      setLoading(false);
    };
    restore();
  }, []);

  // ✅ Logout admin
  const logoutAdmin = async () => {
    await API.post("/admin/logout");
    setAdmin(null);
    setAdminLoggedIn(false);
  };

  // ✅ Logout user
  const logoutUser = async () => {
    await API.post("/users/logout");
    setUser(null);
    setUserLoggedIn(false);
    setUserLoggedInFlag(false);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        adminLoggedIn,
        user,
        userLoggedIn,
        loading,
        fetchAdmin,
        fetchUser,
        logoutAdmin,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
