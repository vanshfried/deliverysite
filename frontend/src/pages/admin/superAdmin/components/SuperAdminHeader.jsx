import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../../../api/api"; // adjust path
import styles from "../css/SuperAdminHeader.module.css"; // CSS module

export default function SuperAdminHeader() {
  const [admin, setAdmin] = useState(null); // null = loading, false = not super admin
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await API.get("/admin/me");
        if (res.data.admin?.isSuper) setAdmin(res.data.admin);
        else navigate("/admin/dashboard");
      } catch {
        setAdmin(false);
        navigate("/admin/login");
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

  if (admin === null) return <div>Loading...</div>;

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
