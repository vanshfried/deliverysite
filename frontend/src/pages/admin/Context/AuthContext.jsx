// AuthContext.jsx
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

  const fetchUser = async () => {
    try {
      const res = await API.get("/users/me");
      setUserLoggedInFlag(true); // ✅ track user login for 401 interceptor
      setUserLoggedIn(true);
      setUser(res.data.user);
    } catch {
      setUserLoggedInFlag(false);
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
    } catch {
      setAdminLoggedIn(false);
      setAdmin(null);
      setIsSuper(false);
    }
  };

  // ✅ Centralized Admin Login
  const loginAdmin = async (email, password) => {
    try {
      const res = await API.post("/admin/login", { email, password });

      if (!res.data.success) {
        return { success: false, error: res.data.error || "Invalid credentials" };
      }

      await fetchAdmin(); // ✅ refresh from DB after cookie issued
      return { success: true, admin: res.data.admin };

    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Server error" };
    }
  };

  // ✅ Centralized Logout (Admin)
  const logoutAdmin = async () => {
    try {
      await API.post("/admin/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setAdmin(null);
      setAdminLoggedIn(false);
      setIsSuper(false);
    }
  };

  // ✅ Restore session only if token cookies exist
  useEffect(() => {
    const restoreSession = async () => {
      const hasUserToken = document.cookie.includes("userToken");
      const hasAdminToken = document.cookie.includes("adminToken");

      if (!hasUserToken && !hasAdminToken) {
        setLoading(false);
        return;
      }

      const requests = [];
      if (hasUserToken) requests.push(fetchUser());
      if (hasAdminToken) requests.push(fetchAdmin());

      await Promise.all(requests);
      setLoading(false);
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        // User auth
        userLoggedIn,
        user,

        // Admin auth
        adminLoggedIn,
        admin,
        isSuper,

        // Auth methods
        loginAdmin,
        logoutAdmin,
        fetchAdmin,
        fetchUser,

        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
