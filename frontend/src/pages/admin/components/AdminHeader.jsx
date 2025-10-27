import React, { useContext } from "react";
import { AuthContext } from "../Context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import API from "../../../api/api.js";
import styles from "../css/AdminHeader.module.css";

export default function AdminHeader() {
  const { setAdmin, setAdminLoggedIn, setIsSuper } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post("/admin/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setAdmin(null);
      setAdminLoggedIn(false);
      setIsSuper(false);
      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <header className={styles.adminHeader}>
      <div className={styles.logo}>
        <Link to="/admin/dashboard">Dashboard</Link>
      </div>

      <nav className={styles.navLinks}>
        <Link to="/admin/create-product">Create Product</Link>
        <Link to="/admin/products">All Products</Link>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </nav>
    </header>
  );
}
