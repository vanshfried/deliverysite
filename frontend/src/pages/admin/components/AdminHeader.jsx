import React, { useContext, useState } from "react";
import { AuthContext } from "../Context/AuthContext.jsx";
import { NotificationContext } from "../Context/NotificationContext.jsx";
import { Link, useNavigate } from "react-router-dom";
import styles from "../css/AdminHeader.module.css";

export default function AdminHeader() {
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
    <header className={styles.adminHeader}>
      <div className={styles.logoLink}>
        <Link to="/admin/dashboard">Admin Panel</Link>
      </div>

      <nav className={styles.navLinks}>
        <Link to="/admin/create-product">Create Product</Link>
        <Link to="/admin/products">All Products</Link>
        <Link to="/admin/users">All Users</Link>

        {/* 🔔 Notification Bell */}
        <div className={styles.notificationWrapper}>
          <button className={styles.bellBtn} onClick={toggleDropdown}>
            🔔
            {notifications.length > 0 && (
              <span className={styles.badge}>{notifications.length}</span>
            )}
          </button>
          {showDropdown && (
            <div className={styles.dropdown}>
              {notifications.length === 0 ? (
                <p>No new orders</p>
              ) : (
                notifications.slice(0, 5).map((n, idx) => (
                  <div key={idx} className={styles.notificationItem}>
                    <p>
                      <b>{n.userName}</b> ({n.phone}, {n.pincode}) ordered ₹
                      {n.totalAmount}
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
              <Link to="/admin/orders" className={styles.viewAll}>
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
