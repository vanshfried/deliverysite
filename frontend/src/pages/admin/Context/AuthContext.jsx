// src/pages/admin/Context/AuthContext.jsx
import React, { createContext, useState, useEffect } from "react";
import API, { setUserLoggedInFlag } from "../../../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [user, setUser] = useState(null);

  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSuper = admin?.isSuper || false;

  // ✅ Admin Login
  const loginAdmin = async (email, password) => {
    try {
      const res = await API.post("/admin/login", { email, password });
      setAdmin(res.data.admin);
      setAdminLoggedIn(true);
      return { success: true, admin: res.data.admin };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Login failed",
      };
    }
  };

  // ✅ Check Admin Session (run only inside admin protected pages)
  const fetchAdmin = async () => {
    try {
      const res = await API.get("/admin/me");

      if (res.data?.admin) {
        setAdmin(res.data.admin);
        setAdminLoggedIn(true);
      } else {
        setAdmin(null);
        setAdminLoggedIn(false);
      }
    } catch {
      setAdmin(null);
      setAdminLoggedIn(false);
    }
  };

  // ✅ Check User Session (initial restore or inside UserProtectedRoute)
  const fetchUser = async () => {
    try {
      const res = await API.get("/users/me");

      if (res.data?.user) {
        setUser(res.data.user);
        setUserLoggedIn(true);
        setUserLoggedInFlag(true);
      } else {
        setUser(null);
        setUserLoggedIn(false);
        setUserLoggedInFlag(false);
      }
    } catch {
      setUser(null);
      setUserLoggedIn(false);
      setUserLoggedInFlag(false);
    }
  };

  // ✅ Restore USER session ONLY once on first load
  useEffect(() => {
    const restoreUserSession = async () => {
      await fetchUser();
      setLoading(false); // ✅ only after initial check
    };
    restoreUserSession();
  }, []);

  // ✅ Admin Logout
  const logoutAdmin = async () => {
    await API.post("/admin/logout");
    setAdmin(null);
    setAdminLoggedIn(false);
  };

  // ✅ User Logout
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
        isSuper,
        user,
        userLoggedIn,
        loading,
        loginAdmin,
        logoutAdmin,
        logoutUser,
        fetchAdmin, // ✅ called only inside admin protected pages
        fetchUser,  // ✅ called only inside user protected pages
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
