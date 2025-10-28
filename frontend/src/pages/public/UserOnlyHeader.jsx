import React, { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../admin/Context/AuthContext.jsx";
import { CartContext } from "../admin/Context/CartContext";
import styles from "./css/UserOnlyHeader.module.css";

const UserOnlyHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { userLoggedIn, logoutUser } = useContext(AuthContext);
  const { cart } = useContext(CartContext);

  const uniqueCartCount = cart?.items?.length || 0;

  const handleLogout = async () => {
    try {
      await logoutUser();
      setMenuOpen(false);
      navigate("/"); // ✅ Redirect after state updates
    } catch (err) {
      console.error("Logout failed:", err.response?.data || err);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={styles.userHeader}>
      <div className={styles.logo}>
        <NavLink to="/" onClick={closeMenu}>MyApp</NavLink>
      </div>

      <nav className={`${styles.navLinks} ${menuOpen ? styles.open : ""}`}>
        {userLoggedIn ? (
          <>
            <NavLink to="/cart" onClick={closeMenu}>
              Cart{" "}
              {uniqueCartCount > 0 && (
                <span className={styles.cartCount}>{uniqueCartCount}</span>
              )}
            </NavLink>
            <NavLink to="/orders" onClick={closeMenu}>Orders</NavLink>
            <NavLink to="/settings" onClick={closeMenu}>Settings</NavLink>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink
            to="/login"
            className={styles.loginBtn}
            onClick={closeMenu}
          >
            Login
          </NavLink>
        )}
      </nav>

      <button
        className={`${styles.hamburger} ${menuOpen ? styles.open : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span><span></span><span></span>
      </button>
    </header>
  );
};

export default UserOnlyHeader;
