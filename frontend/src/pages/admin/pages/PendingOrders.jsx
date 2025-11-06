import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API from "../../../api/api";
import pingsound from "./notification.wav";
import styles from "../css/PendingOrders.module.css";

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const audioRef = useRef(null);
  const socketRef = useRef(null);

  // 🎵 Preload sound
  useEffect(() => {
    const audio = new Audio(pingsound);
    audio.preload = "auto";
    audioRef.current = audio;
  }, []);

  // 📦 Fetch pending orders
  const fetchOrders = async () => {
    try {
      const res = await API.get("api/admin/orders/pending", {
        withCredentials: true,
      });
      setOrders(res.data.orders || []);
      setError("");
    } catch (err) {
      console.error("❌ Failed to load orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // ⚙️ Update order status (Accept/Cancel)
  const updateOrderStatus = async (orderId, action) => {
    try {
      const res = await API.patch(
        `api/admin/orders/${orderId}/status`,
        { action },
        { withCredentials: true }
      );

      toast.success(res.data.message || "Order updated", { autoClose: 2000 });

      // Remove from list after update
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (err) {
      console.error("❌ Failed to update order:", err);
      toast.error(err.response?.data?.message || "Failed to update order", {
        autoClose: 2000,
      });
    }
  };

  // 🔌 Socket setup
  useEffect(() => {
    const socket = io(API.URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("disconnect", () => console.warn("⚠️ Socket disconnected"));

    socket.on("new-order", (data) => {
      console.log("🆕 New order received:", data);

      toast.info(
        `🆕 New order from ${data.userName || "User"} (₹${data.totalAmount})`,
        { position: "top-right", autoClose: 4000, theme: "light" }
      );

      const audio = audioRef.current;
      if (audio) {
        audio.play().catch(() => {
          document.body.addEventListener(
            "click",
            () => audio.play().catch(() => {}),
            { once: true }
          );
        });
      }

      const newOrder = {
        _id: data.orderId || Math.random().toString(36).slice(2),
        user: { name: data.userName || "User", phone: data.phone || "" },
        items: data.items || [],
        totalAmount: data.totalAmount || 0,
        paymentMethod: "COD",
        status: "PENDING",
        createdAt: new Date().toISOString(),
        slug: data.slug || null,
        deliveryAddress: data.deliveryAddress || {},
      };

      setOrders((prev) => {
        const exists = prev.some((o) => o.slug === newOrder.slug);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🧾 Loading / Error UI
  if (loading) return <div className="p-4">Loading orders...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <ToastContainer />
      <h1 className={styles.header}>Pending Orders</h1>

      {orders.length === 0 ? (
        <p className={styles.noOrders}>No pending orders found.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="font-mono text-sm">
                    {o.slug || o._id.slice(-6)}
                  </td>

                  <td>
                    {o.user?.name || "User"} <br />
                    <span className="text-sm text-gray-600">
                      {o.user?.phone}
                    </span>
                  </td>

                  <td className="text-sm text-gray-700">
                    {o.deliveryAddress ? (
                      <>
                        <div>{o.deliveryAddress.label}</div>
                        <div>{o.deliveryAddress.houseNo}</div>
                        <div>{o.deliveryAddress.laneOrSector}</div>
                        <div>{o.deliveryAddress.landmark}</div>
                        <div>
                          <strong>Pincode:</strong> {o.deliveryAddress.pincode}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">No address</span>
                    )}
                  </td>

                  <td className="text-sm">
                    {o.items.map((i, idx) => (
                      <div key={idx}>
                        {i.name} × {i.quantity}
                      </div>
                    ))}
                  </td>

                  <td>₹{o.totalAmount}</td>
                  <td>{o.paymentMethod}</td>

                  <td>
                    <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                      {o.status}
                    </span>
                  </td>

                  <td className="space-x-2">
                    <button
                      className={`${styles.actionBtn} ${styles.acceptBtn}`}
                      onClick={() => updateOrderStatus(o._id, "ACCEPT")}
                    >
                      ✅ Accept
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.cancelBtn}`}
                      onClick={() => updateOrderStatus(o._id, "CANCEL")}
                    >
                      ❌ Cancel
                    </button>
                  </td>

                  <td className="text-sm text-gray-500">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
