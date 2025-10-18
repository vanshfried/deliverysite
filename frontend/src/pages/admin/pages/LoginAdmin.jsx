import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import styles from "../css/LoginAdmin.module.css"; // <-- CSS module

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return setMessage("Email and password required");

    setLoading(true);
    setMessage("");

    try {
      const res = await API.post("/adminlogin/login", { email, password });

      if (res.data.success) {
        if (res.data.isSuper) {
          navigate("/admin/superadmin-dashboard");
        } else {
          navigate("/admin/dashboard");
        }
      } else {
        setMessage(res.data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
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
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {message && <p className={styles.loginMessage}>{message}</p>}
    </div>
  );
}
