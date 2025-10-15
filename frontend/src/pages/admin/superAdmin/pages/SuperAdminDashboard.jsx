import React from "react";
import { Link } from "react-router-dom";
import ProtectedRoute from "../../../../components/ProtectedRoutes";
import "../css/SuperAdminDashboard.css"; // ensure path is correct

function DashboardContent() {
  const tools = [
    { title: "Create Admins", link: "/admin/create-admin" },
    { title: "Create Product", link: "/admin/create-product" },
    { title: "View Products",  link: "/admin/products" },
    { title: "SuperAdmin Extras",  link: "/admin/superadmin-extras" },
  ];

  return (
    <div className="superadmin-dashboard">
      <header>
        <h2>Super Admin Dashboard</h2>
        <p>Welcome, superadmin! Full access granted.</p>
      </header>

      <div className="tools">
        {tools.map((tool, idx) => (
          <Link key={idx} to={tool.link} className="tool-card">
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
