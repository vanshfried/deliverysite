import React,{ useState } from "react";
import { storeOwnerLogin } from "../api/storeOwner";
import { setStoreOwnerLoggedInFlag } from "../api/api";

export default function StoreOwnerLogin() {
  const [form, setForm] = useState({
    phone: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await storeOwnerLogin(form);

    if (res?.data) {
      setMessage("Login successful!");
      setStoreOwnerLoggedInFlag(true);

      window.location.href = "/store-owner/dashboard";
    } else {
      setMessage("Invalid credentials");
    }
  };

  return (
    <div>
      <h2>Store Owner Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit">Login</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
