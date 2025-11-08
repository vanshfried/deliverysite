import React, { useEffect, useState } from "react";
import API from "../../api/api";
import styles from "../../css/DeliveryDashboard.module.css";

export default function DeliveryDashboard() {
  const [deliveryBoy, setDeliveryBoy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/delivery/me");
      if (res?.data?.success) setDeliveryBoy(res.data.deliveryBoy);
      else setMsg(res?.data?.error || "Failed to fetch profile");
    } catch (err) {
      setMsg(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const res = await API.patch("/api/delivery/status", {
        isActive: !deliveryBoy.isActive,
      });
      if (res?.data?.success) {
        setDeliveryBoy((prev) => ({ ...prev, isActive: !prev.isActive }));
        setMsg(res.data.message);
      } else setMsg(res?.data?.error || "Failed to update status");
    } catch (err) {
      setMsg(err.response?.data?.error || "Request failed");
    }

    setTimeout(() => setMsg(""), 3000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!deliveryBoy) return <p className={styles.error}>{msg || "No profile found"}</p>;

  return (
    <div className={styles.container}>
      <h2>Delivery Dashboard</h2>
      {msg && <p className={styles.message}>{msg}</p>}
      <div className={styles.card}>
        <p><strong>Name:</strong> {deliveryBoy.name}</p>
        <p><strong>Phone:</strong> {deliveryBoy.phone}</p>
        <p>
          <strong>Status:</strong> {deliveryBoy.isActive ? "Active" : "Inactive"}
          <button className={styles.toggleBtn} onClick={toggleStatus}>
            {deliveryBoy.isActive ? "Go Inactive" : "Go Active"}
          </button>
        </p>
      </div>
    </div>
  );
}
