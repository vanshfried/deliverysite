// StoreProfileEdit.jsx
import React, { useEffect, useState } from "react";
import { updateStoreProfile, storeOwnerMe } from "../api/storeOwner";
import { useNavigate } from "react-router-dom";
import StoreOwnerLayout from "../components/StoreOwnerLayout"; // wrap page

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

  const navigate = useNavigate();

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, storeImage: file });
    if (file) setImagePreview(URL.createObjectURL(file));
  };

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
    if (res) navigate("/store-owner/dashboard");
  };

  return (
    <StoreOwnerLayout>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2>Edit Store Profile</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <label>Store Image</label>
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Store"
              style={{
                width: "120px",
                height: "120px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          ) : (
            <div
              style={{
                width: "120px",
                height: "120px",
                background: "#eee",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              No Image
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} />

          <label>Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
          />

          <label>Phone</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            style={{ height: "120px" }}
          />

          <label>Opening Time</label>
          <input
            type="time"
            name="openingTime"
            value={form.openingTime}
            onChange={handleChange}
          />

          <label>Closing Time</label>
          <input
            type="time"
            name="closingTime"
            value={form.closingTime}
            onChange={handleChange}
          />

          <button
            type="submit"
            style={{
              padding: "12px",
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
            }}
          >
            Save Changes
          </button>
        </form>
      </div>
    </StoreOwnerLayout>
  );
}
