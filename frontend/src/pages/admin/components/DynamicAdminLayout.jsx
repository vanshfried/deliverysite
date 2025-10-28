import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import SuperAdminHeader from "../superAdmin/components/SuperAdminHeader";
import { AuthContext } from "../Context/AuthContext";

const DynamicAdminLayout = ({ children }) => {
  const { adminLoggedIn, isSuper, loading } = useContext(AuthContext);

  // ✅ Avoid UI flicker while checking session
  if (loading) return <div>Loading...</div>;

  // ✅ If not logged in (route guard safety)
  if (!adminLoggedIn) return <Navigate to="/admin/login" replace />;

  return (
    <>
      {isSuper ? <SuperAdminHeader /> : <AdminHeader />}
      <main>{children}</main>
    </>
  );
};

export default DynamicAdminLayout;
