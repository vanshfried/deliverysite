import React, { useState } from "react";
import API from "../../../../api/api";
import styles from "../css/CreateAdmin.module.css";

export default function CreateAdmin() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false); // new state
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await API.post("admin/create-admin", { username, email, password });
      
      if (res.data.success) {
        setMessage(`✅ Admin created: ${res.data.admin.username}`);
        setIsError(false);
        setUsername("");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "❌ Error creating admin");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createAdminContainer}>
      <h2>Create Admin</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Creating..." : "Create Admin"}
        </button>
      </form>

      {message && (
        <p className={`${styles.message} ${isError ? styles.error : styles.success}`}>
          {message}
        </p>
      )}
    </div>
  );
}
