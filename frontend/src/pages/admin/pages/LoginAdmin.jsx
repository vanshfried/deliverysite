import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/LoginAdmin.module.css";
import { AuthContext } from "../Context/AuthContext";

export default function LoginAdmin() {
  const { adminLoggedIn, isSuper, loading, loginAdmin } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && adminLoggedIn) {
      navigate(isSuper ? "/admin/superadmin-dashboard" : "/admin/dashboard", {
        replace: true,
      });
    }
  }, [adminLoggedIn, isSuper, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setMessage("Email and password required");

    setLoadingLogin(true);
    setMessage("");

    const res = await loginAdmin(email, password);

    if (res.success) {
      navigate(res.admin.isSuper ? "/admin/superadmin-dashboard" : "/admin/dashboard",
        { replace: true }
      );
    } else {
      setMessage(res.error || "Invalid credentials");
    }

    setLoadingLogin(false);
  };

  return (
    <div className={styles.loginAdminContainer}>
      <h2>Admin Login</h2>
      <form className={styles.loginAdminForm} onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loadingLogin}>
          {loadingLogin ? "Logging in..." : "Login"}
        </button>
      </form>
      {message && <p className={styles.loginMessage}>{message}</p>}
    </div>
  );
}
