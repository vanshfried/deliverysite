import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../../../api/api"; // adjust path
import "../css/SuperAdminHeader.css";

export default function SuperAdminHeader() {
  const [admin, setAdmin] = useState(null); // null = loading, false = not super admin
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await API.get("/admin/me");
        if (res.data.admin?.isSuper) setAdmin(res.data.admin);
        else navigate("/admin/dashboard"); // redirect normal admin
      } catch {
        setAdmin(false);
        navigate("/admin/login"); // redirect if not logged in
      }
    };
    checkLogin();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await API.post("/adminlogout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setAdmin(false);
      navigate("/admin/login");
    }
  };

  // Show loading while checking
  if (admin === null) return <div>Loading...</div>;

  return (
    <header className="superadmin-header">
      <div className="logo">SuperAdmin Panel</div>
      <nav className="nav-links">
        <Link to="/admin/superadmin-dashboard">Dashboard</Link>
        <Link to="/admin/create-admin">Create Admin</Link>
        <Link to="/admin/create-product">Create Product</Link>
        <Link to="/admin/products">All Products</Link>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </nav>
    </header>
  );
}
