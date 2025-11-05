import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import SuperAdminHeader from "../superAdmin/components/SuperAdminHeader";
import { AuthContext } from "../Context/AuthContext";
import { NotificationProvider } from "../Context/NotificationContext";
const DynamicAdminLayout = ({ children }) => {
  const { adminLoggedIn, isSuper, loading } = useContext(AuthContext);

  // ✅ Avoid UI flicker while checking session
  if (loading) return <div>Loading...</div>;

  // ✅ If not logged in (route guard safety)
  if (!adminLoggedIn) return <Navigate to="/admin/login" replace />;

  return (
    <NotificationProvider>
      {isSuper ? <SuperAdminHeader /> : <AdminHeader />}
      <main>{children}</main>
    </NotificationProvider>
  );
};

export default DynamicAdminLayout;
