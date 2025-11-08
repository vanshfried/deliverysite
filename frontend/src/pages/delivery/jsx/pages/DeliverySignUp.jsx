// frontend\src\pages\delivery\jsx\pages\DeliverySignUp.jsx
import React, { useState } from "react";
import API from "../../api/api";
import styles from "../../css/DeliveryAuth.module.css";


export default function DeliverySignUp() {
  const [form, setForm] = useState({ name: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone" && !/^\d{0,10}$/.test(value)) return; // limit phone
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (form.phone.length !== 10)
      return setMsg("📞 Phone number must be exactly 10 digits.");

    const strongPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!strongPassword.test(form.password))
      return setMsg("🔐 Password must be 8+ chars, include a number & a special character.");

    setLoading(true);
    try {
      const res = await API.post("/api/delivery/signup", form);
      if (res?.data?.success) {
        setMsg("✅ Registration successful! Please wait for admin approval.");
        setForm({ name: "", phone: "", password: "" });
      } else {
        setMsg(res?.data?.error || "Unexpected response from server");
      }
    } catch (err) {
      setMsg(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Delivery Partner Registration</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number (10 digits)"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Create Password"
            value={form.password}
            onChange={handleChange}
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
          {loading ? "Submitting..." : "Register"}
        </button>
      </form>
      {msg && <p className={styles.message}>{msg}</p>}
    </div>
  );
}



