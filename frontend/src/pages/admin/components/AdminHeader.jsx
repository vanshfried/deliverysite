import React, { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import API from "../../../api/api.js";
import "../css/AdminHeader.css";

export default function AdminHeader() {
  const { setIsLoggedIn, setIsSuper } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post("/adminlogout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoggedIn(false);
      setIsSuper(false);
      navigate("/admin/login");
    }
  };

  return (
    <header className="admin-header">
      <div className="logo">
        <Link to="/admin/login">MyAdminPanel</Link>
      </div>
      <nav className="nav-links">
        <Link to="/admin/dashboard">Dashboard</Link>
        <Link to="/admin/create-product">Create Product</Link>
         <Link to="/admin/products">All Products</Link>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </nav>
    </header>
  );
}
