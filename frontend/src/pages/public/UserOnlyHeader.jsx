import React, { useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../admin/Context/AuthContext.jsx";
import { CartContext } from "../admin/Context/CartContext";
import API from "../../api/api";
import "./css/UserOnlyHeader.css";

const UserOnlyHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { userLoggedIn, setUserLoggedIn, setUser } = useContext(AuthContext);
  const { cart } = useContext(CartContext); // live cart

  // Count unique items in cart
  const uniqueCartCount = cart?.items?.length || 0;

  const handleLogout = async () => {
    try {
      await API.post("/users/logout", {}, { withCredentials: true }); // clear cookie on backend
      setUserLoggedIn(false);
      setUser(null);
      setMenuOpen(false);
    } catch (err) {
      console.error("Logout failed:", err.response?.data || err);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="user-header">
      <div className="logo">
        <NavLink to="/" onClick={closeMenu}>MyApp</NavLink>
      </div>

      <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
        {userLoggedIn ? (
          <>
            <NavLink to="/cart" onClick={closeMenu}>
              Cart {uniqueCartCount > 0 && <span className="cart-count">{uniqueCartCount}</span>}
            </NavLink>
            <NavLink to="/orders" onClick={closeMenu}>Orders</NavLink>
            <NavLink to="/settings" onClick={closeMenu}>Settings</NavLink>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login" className="login-btn" onClick={closeMenu}>Login</NavLink>
        )}
      </nav>

      <div
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
    </header>
  );
};

export default UserOnlyHeader;
