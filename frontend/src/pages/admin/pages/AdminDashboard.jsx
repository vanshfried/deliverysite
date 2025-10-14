import React, { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { Link } from "react-router-dom";
import "../css/AdminDashboard.css";

function AdminDashboard() {
  const { admin, loading } = useContext(AuthContext);

  if (loading) return <p className="loading-text">Loading...</p>;

  // Dashboard cards with link for each action
  const dashboardActions = [
    { title: "Add Product", value: "Create new products", link: "/admin/create-product" },
    { title: "View Products", value: "All products", link: "/admin/products" },
  ];

  return (
    <div className="admin-dashboard">
      <header>
        <h1>Welcome to the Admin Dashboard {admin?.username || "Admin"}</h1>
      </header>

      <div className="dashboard-cards">
        {dashboardActions.map((action, idx) => (
          <Link key={idx} to={action.link} className="dashboard-card">
            <h2>{action.title}</h2>
            <p>{action.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
