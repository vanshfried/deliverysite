import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../Context/AuthContext";
import { NotificationContext } from "../../Context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";
import API from "../../../../api/api";
import styles from "../css/SuperAdminHeader.module.css";

export default function SuperAdminHeader() {
  const { logoutAdmin } = useContext(AuthContext);
  const { notifications, setNotifications } = useContext(NotificationContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) setNotifications([]); // mark as read
  };

  // 📊 Fetch counts for pending & active orders
  const fetchCounts = async () => {
    try {
      const [pendingRes, activeRes] = await Promise.all([
        API.get("api/admin/orders/count/pending", { withCredentials: true }),
        API.get("api/admin/orders/count/active", { withCredentials: true }),
      ]);

      setPendingCount(pendingRes.data.count || 0);
      setActiveCount(activeRes.data.count || 0);
    } catch (err) {
      console.error("❌ Failed to fetch order counts:", err);
    }
  };

  useEffect(() => {
    fetchCounts();

    // 🕐 Optional: Refresh counts every 15s (lightweight)
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, []);

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

        <Link to="/admin/pending-orders" className={styles.navItemWithBadge}>
          Pending Orders
          {pendingCount > 0 && (
            <span className={styles.countBadge}>{pendingCount}</span>
          )}
        </Link>

        <Link to="/admin/active-orders" className={styles.navItemWithBadge}>
          Active Orders
          {activeCount > 0 && (
            <span className={styles.countBadge}>{activeCount}</span>
          )}
        </Link>

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
                      <b>{n.phone}</b> {n.name} ({n.pincode}) — ₹{n.totalAmount}
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
              <Link to="/admin/pending-orders" className={styles.viewAll}>
                View Pending Orders
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
