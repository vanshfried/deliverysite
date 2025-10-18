import React from "react";
import { Link } from "react-router-dom";
import ProtectedRoute from "../../../../components/ProtectedRoutes";
import styles from "../css/SuperAdminDashboard.module.css"; // CSS module

function DashboardContent() {
  const tools = [
    { title: "Create Admins", link: "/admin/create-admin" },
    { title: "Create Product", link: "/admin/create-product" },
    { title: "View Products",  link: "/admin/products" },
    { title: "SuperAdmin Extras",  link: "/admin/superadmin-extras" },
  ];

  return (
    <div className={styles.superadminDashboard}>
      <header>
        <h2>Super Admin Dashboard</h2>
        <p>Welcome, superadmin! Full access granted.</p>
      </header>

      <div className={styles.tools}>
        {tools.map((tool, idx) => (
          <Link key={idx} to={tool.link} className={styles.toolCard}>
            {tool.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SuperAdminDashboardWrapper() {
  return (
    <ProtectedRoute requireSuper={true}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
