import React, { useEffect, useState } from "react";
import { updateStoreProfile,storeOwnerMe } from "../api/storeOwner";


export default function StoreProfileEdit() {
  const [store, setStore] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    address: "",
    description: "",
    phone: "",
    openingTime: "",
    closingTime: "",
    storeImage: null,
  });

  // Fetch current store data
  useEffect(() => {
    const loadData = async () => {
      const res = await storeOwnerMe();
      if (res?.data?.store) {
        const s = res.data.store;
        setStore(s);

        setForm({
          address: s.address || "",
          description: s.description || "",
          phone: s.phone || "",
          openingTime: s.openingTime || "",
          closingTime: s.closingTime || "",
          storeImage: null,
        });

        if (s.storeImage) setImagePreview(s.storeImage);
      }
    };
    loadData();
  }, []);

  if (!store) return <p>Loading store profile...</p>;

  // Handle text inputs
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Handle image upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, storeImage: file });
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("address", form.address);
    fd.append("description", form.description);
    fd.append("phone", form.phone);
    fd.append("openingTime", form.openingTime);
    fd.append("closingTime", form.closingTime);

    if (form.storeImage) fd.append("storeImage", form.storeImage);

    const res = await updateStoreProfile(fd);

    if (res) {
      alert("Store profile updated!");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Edit Store Profile</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Image upload */}
        <label style={styles.label}>Store Image</label>
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Store"
            style={styles.image}
          />
        ) : (
          <div style={styles.noImage}>No Image</div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={styles.input}
        />

        <label style={styles.label}>Address</label>
        <input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          style={styles.input}
        />

        <label style={styles.label}>Phone</label>
        <input
          type="text"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          style={styles.input}
        />

        <label style={styles.label}>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          style={styles.textarea}
        />

        <label style={styles.label}>Opening Time</label>
        <input
          type="time"
          name="openingTime"
          value={form.openingTime}
          onChange={handleChange}
          style={styles.input}
        />

        <label style={styles.label}>Closing Time</label>
        <input
          type="time"
          name="closingTime"
          value={form.closingTime}
          onChange={handleChange}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Save Changes
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { padding: "30px", maxWidth: "600px", margin: "0 auto" },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  label: { fontWeight: 600 },
  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
  },
  textarea: {
    padding: "10px",
    height: "120px",
    border: "1px solid #ddd",
    borderRadius: "6px",
  },
  image: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  noImage: {
    width: "120px",
    height: "120px",
    background: "#eee",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px",
  },
  button: {
    padding: "12px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
  },
};
