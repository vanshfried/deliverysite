// frontend\src\pages\delivery\jsx\pages\DeliveryLogin.jsx
import React, { useState } from "react";
import API, { setDeliveryLoggedInFlag } from "../../api/api";
import styles from "../../css/DeliveryAuth.module.css";

export default function DeliveryLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,10}$/.test(value)) setPhone(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (phone.length !== 10)
      return setMsg("📞 Phone number must be exactly 10 digits.");

    if (password.length < 8)
      return setMsg("🔐 Password must be at least 8 characters long.");

    setLoading(true);
    try {
      const res = await API.post("/api/delivery/login", { phone, password });
      if (res?.data?.success) {
        setDeliveryLoggedInFlag(true);
        setMsg("✅ Login successful!");
        window.location.href = "/delivery/dashboard";
      } else {
        setMsg(res?.data?.error || "Invalid credentials");
      }
    } catch (err) {
      setMsg(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Delivery Partner Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          placeholder="Phone Number (10 digits)"
          value={phone}
          onChange={handlePhoneChange}
          required
        />

        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className={styles.showBtn}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈 Hide" : "👁 Show"}
          </button>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      {msg && <p className={styles.message}>{msg}</p>}
    </div>
  );
}

