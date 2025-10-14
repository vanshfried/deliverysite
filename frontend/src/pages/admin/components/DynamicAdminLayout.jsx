import React, { useContext } from "react";
import AdminHeader from "./AdminHeader";
import SuperAdminHeader from "../superAdmin/components/SuperAdminHeader";
import { AuthContext } from "../Context/AuthContext";

const DynamicAdminLayout = ({ children }) => {
  const { isSuper } = useContext(AuthContext);

  return (
    <>
      {isSuper ? <SuperAdminHeader /> : <AdminHeader />}
      <main>{children}</main>
    </>
  );
};

export default DynamicAdminLayout;
