import React, { useContext, useState } from "react";
import { AuthContext } from "../../Context/AuthContext";
import { NotificationContext } from "../../Context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/SuperAdminHeader.module.css";

export default function SuperAdminHeader() {
  const { logoutAdmin } = useContext(AuthContext);
  const { notifications, setNotifications } = useContext(NotificationContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) setNotifications([]); // mark as read
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

        {/* 🔔 Notification Bell */}
        {/* 🔔 Notification Bell */}
        <div className={styles.notificationWrapper}>
          <button
            className={styles.bellBtn}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            🔔
            {notifications.length > 0 && (
              <span className={styles.badge}>{notifications.length}</span>
            )}
          </button>

          {showDropdown && (
            <div className={styles.dropdown}>
              {notifications.length === 0 ? (
                <p>No recent orders</p>
              ) : (
                notifications.map((n, idx) => (
                  <div key={idx} className={styles.notificationItem}>
                    <p>
                      <b>{n.phone}</b>{n.name} ({n.pincode}) — ₹{n.totalAmount}
                    </p>
                    <ul>
                      {n.items.map((item, i) => (
                        <li key={i}>
                          {item.name.length > 20
                            ? item.name.slice(0, 20) + "…"
                            : item.name}{" "}
                          × {item.quantity} @ ₹{item.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
              <Link to="/admin/recent-orders" className={styles.viewAll}>
                View All Orders
              </Link>
            </div>
          )}
        </div>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </nav>
    </header>
  );
}
