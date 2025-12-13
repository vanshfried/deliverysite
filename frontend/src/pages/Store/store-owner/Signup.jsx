import React, { useState } from "react";
import styles from "../css/StoreOwnerSignup.module.css";
import { storeOwnerSignup } from "../api/storeOwner";

export default function StoreOwnerSignup() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    storeName: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (form.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    const res = await storeOwnerSignup(form);

    if (res) {
      setMessage(res.data.message);
      setForm({
        fullName: "",
        phone: "",
        storeName: "",
        password: "",
      });
      setShowPassword(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Store Owner Signup</h2>
        <p className={styles.subtitle}>Create your store account</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Store Name</label>
            <input
              type="text"
              name="storeName"
              value={form.storeName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <button type="submit" className={styles.signupBtn}>
            Create Account
          </button>
        </form>

        <div className={styles.loginLink}>
          Already have an account? <a href="/store-owner/login">Login</a>
        </div>
      </div>
    </div>
  );
}
