// StoreOwnerHeader.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { storeOwnerMe } from "../api/storeOwner";
import styles from "../css/StoreOwnerHeader.module.css";

export default function StoreOwnerHeader() {
  const [owner, setOwner] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false); // for mobile menu toggle
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOwner = async () => {
      const res = await storeOwnerMe();
      if (res?.data) setOwner(res.data.owner);
    };
    fetchOwner();
  }, []);

  const handleLogout = () => navigate("/store-owner/logout");

  if (!owner) return null;

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {/* Logo links to Dashboard */}
        <Link to="/store-owner/dashboard" className={styles.logo}>
          <h2>Owner Dashboard</h2>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}>
          <Link to="/store-owner/store-profile" className={styles.navLink}>
            Store Profile Edit
          </Link>
          <Link to="/store-owner/products" className={styles.navLink}>
            All Products
          </Link>
          <Link to="/store-owner/orders" className={styles.navLink}>
            Orders
          </Link>
          <Link to="/store-owner/products/create" className={styles.navLink}>
            Create Product
          </Link>
        </nav>
      </div>

      <div className={styles.userSection}>
        <span className={styles.ownerName}>Hi, {owner.fullName}</span>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
    </header>
  );
}
