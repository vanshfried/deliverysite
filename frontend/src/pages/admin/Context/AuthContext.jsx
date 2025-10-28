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
      const res = await API.post("/admin/login", { email, password }, { withCredentials: true });
      setAdmin(res.data.admin);
      setAdminLoggedIn(true);
      return { success: true, admin: res.data.admin };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Login failed" };
    }
  };

  // ✅ Admin Restore
  const fetchAdmin = async () => {
    try {
      const res = await API.get("/admin/me", { withCredentials: true });
      if (res.data.admin) {
        setAdmin(res.data.admin);
        setAdminLoggedIn(true);
      }
    } catch {
      // ❌ No console.error - avoid noise
      setAdmin(null);
      setAdminLoggedIn(false);
    }
  };

  // ✅ User Restore
  const fetchUser = async () => {
    try {
      const res = await API.get("/users/me", { withCredentials: true });
      if (res.data.user) {
        setUser(res.data.user);
        setUserLoggedIn(true);
        setUserLoggedInFlag(true);
      }
    } catch {
      // ❌ No console.error
      setUser(null);
      setUserLoggedIn(false);
      setUserLoggedInFlag(false);
    }
  };

  // ✅ Restore session on load
  useEffect(() => {
    const restoreSession = async () => {
      await Promise.all([fetchAdmin(), fetchUser()]);
      setLoading(false);
    };
    restoreSession();
  }, []);

  // ✅ Admin Logout
  const logoutAdmin = async () => {
    await API.post("/admin/logout", {}, { withCredentials: true });
    setAdmin(null);
    setAdminLoggedIn(false);
  };

  // ✅ User Logout
  const logoutUser = async () => {
    await API.post("/users/logout", {}, { withCredentials: true });
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
        fetchAdmin,
        fetchUser, // ✅ Access from other components
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
