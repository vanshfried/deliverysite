import React, { useContext, useEffect } from "react";
import { AuthContext } from "../../Context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/SuperAdminHeader.module.css";

export default function SuperAdminHeader() {
  const { adminLoggedIn, isSuper, setAdmin, setAdminLoggedIn, setIsSuper, loading } =
    useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!adminLoggedIn) {
        navigate("/admin/login", { replace: true });
      } else if (!isSuper) {
        navigate("/admin/dashboard", { replace: true });
      }
    }
  }, [loading, adminLoggedIn, isSuper, navigate]);

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

  if (loading) return null; // Header invisible until auth restored ✅

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
