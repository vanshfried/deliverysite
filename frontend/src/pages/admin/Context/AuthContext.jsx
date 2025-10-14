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

  // Check user login
  const fetchUser = async () => {
    try {
      const res = await API.get("/users/me");
      setUserLoggedIn(true);
      setUser(res.data.user);
    } catch {
      setUserLoggedIn(false);
      setUser(null);
    }
  };

  // Check admin login
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
