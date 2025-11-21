import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";
import styles from "../css/SuperAdminHeader.module.css";

export default function SuperAdminHeader() {
  const { logoutAdmin } = React.useContext(AuthContext);
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
        <Link to="/admin/create-admin">Create Admins</Link>
        <Link to="/admin/users">View Users</Link>
        <Link to="/admin/delivery-applicants">Delivery Applicants</Link>
        <Link to="/admin/All-delivery-boys">All Delivery Boys</Link>
        <Link to="/admin/store-applications">All Store Applications</Link>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </nav>
    </header>
  );
}
