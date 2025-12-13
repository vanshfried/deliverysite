import React, { useState } from "react";
import styles from "../css/StoreOwnerLogin.module.css";
import { storeOwnerLogin } from "../api/storeOwner";
import { setStoreOwnerLoggedInFlag } from "../api/api";

export default function StoreOwnerLogin() {
  const [form, setForm] = useState({
    phone: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ 10-digit phone validation
    if (name === "phone") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (form.phone.length !== 10) {
      setIsError(true);
      setMessage("Phone number must be exactly 10 digits");
      return;
    }

    const res = await storeOwnerLogin(form);

    if (res?.data) {
      setIsError(false);
      setMessage("Login successful!");
      setStoreOwnerLoggedInFlag(true);
      window.location.href = "/store-owner/dashboard";
    } else {
      setIsError(true);
      setMessage("Invalid credentials");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Store Owner Login</h2>
        <p className={styles.subtitle}>Access your dashboard</p>

        <form onSubmit={handleSubmit}>
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

          {message && (
            <p className={`${styles.message} ${isError ? styles.error : ""}`}>
              {message}
            </p>
          )}

          <button type="submit" className={styles.loginBtn}>
            Login
          </button>
        </form>

        <div className={styles.signupLink}>
          Don’t have an account? <a href="/store-owner/signup">Sign up</a>
        </div>
      </div>
    </div>
  );
}
