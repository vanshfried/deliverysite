import React, { useContext } from "react";
import { AuthContext } from "../../Context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/SuperAdminHeader.module.css";

export default function SuperAdminHeader() {
  const { logoutAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className={styles.superadminHeader}>
      <Link to="/admin/superadmin-dashboard" className={styles.logoLink}>
        SuperAdmin Panel
      </Link>

      <nav className={styles.navLinks}>
        <Link to="/admin/superadmin-extras">Category/Tags</Link>
        <Link to="/admin/create-admin">Create Admin</Link>
        <Link to="/admin/create-product">Create Product</Link>
        <Link to="/admin/products">All Products</Link>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </nav>
    </header>
  );
}
