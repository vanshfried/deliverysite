import React,{ useState } from "react";
import { storeOwnerSignup } from "../api/storeOwner";

export default function StoreOwnerSignup() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    storeName: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await storeOwnerSignup(form);

    if (res) {
      setMessage(res.data.message);
    }
  };

  return (
    <div>
      <h2>Store Owner Signup</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
        />

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
        />

        <input
          type="text"
          name="storeName"
          placeholder="Store Name"
          value={form.storeName}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit">Submit</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
