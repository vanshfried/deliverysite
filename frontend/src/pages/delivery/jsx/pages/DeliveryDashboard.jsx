import React, { useEffect, useState, useRef } from "react";
import API from "../../api/api";
import styles from "../../css/DeliveryDashboard.module.css";

export default function DeliveryDashboard() {
  const [deliveryBoy, setDeliveryBoy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  const msgTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const showMessage = (text, duration = 3000) => {
    setMsg(text);
    if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    msgTimeoutRef.current = setTimeout(() => setMsg(""), duration);
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get("/api/delivery/me");
      if (!mountedRef.current) return;
      if (res?.data?.success) setDeliveryBoy(res.data.deliveryBoy);
      else showMessage(res?.data?.error || "Failed to fetch profile");
    } catch (err) {
      if (!mountedRef.current) return;
      showMessage(err.response?.data?.error || "Something went wrong");
    } finally {
      if (!mountedRef.current) return;
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
        showMessage(res.data.message);
      } else showMessage(res?.data?.error || "Failed to update status");
    } catch (err) {
      showMessage(err.response?.data?.error || "Request failed");
    }
  };

  const fetchNextOrder = async () => {
    setOrderLoading(true);
    try {
      const res = await API.get("/api/delivery/orders/available");
      if (!mountedRef.current) return;
      const nextOrder = res?.data?.orders?.[0] || null;
      setCurrentOrder(nextOrder);
      if (!nextOrder) showMessage("No pending orders");
    } catch (err) {
      if (!mountedRef.current) return;
      setCurrentOrder(null);
      showMessage(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      if (!mountedRef.current) return;
      setOrderLoading(false);
    }
  };

  const handleOrderDecision = async (decision) => {
    if (!currentOrder) return;

    const endpoint =
      decision === "accept"
        ? `/api/delivery/orders/accept/${currentOrder._id}`
        : `/api/delivery/orders/reject/${currentOrder._id}`;

    try {
      const res = await API.patch(endpoint);

      if (!mountedRef.current) return;

      if (res?.data?.success) {
        showMessage(res.data.message);

        // Clear the current order immediately so the UI updates
        setCurrentOrder(null);

        // Refresh profile stats after decision
        const profileRes = await API.get("/api/delivery/me");
        if (profileRes?.data?.success) {
          setDeliveryBoy(profileRes.data.deliveryBoy);
        }

        // Fetch the next available order
        fetchNextOrder();
      } else {
        showMessage(res?.data?.message || `Failed to ${decision} order`);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      showMessage(err.response?.data?.message || "Request failed");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchProfile();
    return () => {
      mountedRef.current = false;
      if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (deliveryBoy?.isActive) fetchNextOrder();
    else setCurrentOrder(null);
  }, [deliveryBoy?.isActive]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!deliveryBoy)
    return <p className={styles.error}>{msg || "No profile found"}</p>;

  const { stats } = deliveryBoy;
  const totalOrders = stats.accepted + stats.delivered + stats.ignored;

  const renderAddress = (address) => {
    if (!address) return <p className={styles.noOrder}>No address</p>;

    // Extract address fields
    const { label, houseNo, laneOrSector, landmark, pincode, coords } = address;

    // Combine them in one line
    const addressLine = [label, houseNo, laneOrSector, landmark, pincode]
      .filter(Boolean) // remove null/undefined
      .join(", ");

    return (
      <div className={styles.addressCardCompact}>
        {addressLine}
        {coords && typeof coords === "object" && (
          <span>
            {" "}
            | Lat: {coords.lat}, Lon: {coords.lon}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      {msg && <div className={styles.toast}>{msg}</div>}

      <header className={styles.header}>
        <h1>Welcome, {deliveryBoy.name}</h1>
        <button
          className={`${styles.toggleStatus} ${
            deliveryBoy.isActive ? styles.active : ""
          }`}
          onClick={toggleStatus}
        >
          {deliveryBoy.isActive ? "Go Inactive" : "Go Active"}
        </button>
      </header>

      <section className={styles.stats}>
        {[
          { label: "Accepted", value: stats.accepted, color: "accepted" },
          { label: "Delivered", value: stats.delivered, color: "delivered" },
          { label: "Rejected", value: stats.ignored, color: "rejected" },
          { label: "Total Orders", value: totalOrders, color: "total" },
          { label: "Rating", value: stats.rating.toFixed(1), color: "rating" },
        ].map((s, idx) => (
          <div key={idx} className={`${styles.statCard} ${styles[s.color]}`}>
            <p className={styles.statLabel}>{s.label}</p>
            <span className={styles.statValue}>{s.value}</span>
          </div>
        ))}
      </section>

      {deliveryBoy.isActive && (
        <section className={styles.currentOrder}>
          <h2>Current Order</h2>
          {orderLoading ? (
            <p>Loading order...</p>
          ) : currentOrder ? (
            <div className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <span>
                  <strong>Order:</strong> {currentOrder.slug}
                </span>
                <span>
                  <strong>Status:</strong> {currentOrder.status}
                </span>
              </div>

              <div className={styles.customerInfo}>
                <p>
                  <strong>Customer:</strong> {currentOrder.user?.name}
                </p>
                <p>
                  <strong>Phone:</strong> {currentOrder.user?.phone}
                </p>
              </div>

              {renderAddress(currentOrder.deliveryAddress)}

              {currentOrder.items?.length > 0 && (
                <div className={styles.itemsList}>
                  <h4>Items</h4>
                  {currentOrder.items.map((i, idx) => (
                    <p key={idx}>
                      {i.name} × {i.quantity}
                    </p>
                  ))}
                </div>
              )}

              <div className={styles.orderFooter}>
                <span>
                  <strong>Total:</strong> ₹{currentOrder.totalAmount}
                </span>
                <span>
                  <strong>Payment:</strong> {currentOrder.paymentMethod}
                </span>
              </div>

              <div className={styles.orderButtons}>
                <button
                  className={styles.acceptBtn}
                  onClick={() => handleOrderDecision("accept")}
                >
                  Accept
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => handleOrderDecision("reject")}
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <p className={styles.noOrder}>No pending orders</p>
          )}
        </section>
      )}
    </div>
  );
}
