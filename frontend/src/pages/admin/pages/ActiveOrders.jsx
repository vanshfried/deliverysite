import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API from "../../../api/api";
import styles from "../css/ActiveOrders.module.css";

export default function ActiveOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔄 Fetch active (processing / out for delivery) orders
  const fetchOrders = async () => {
    try {
      const res = await API.get("api/admin/orders/active", {
        withCredentials: true,
      });
      setOrders(res.data.orders || []);
      setError("");
    } catch (err) {
      console.error("❌ Failed to load active orders:", err);
      setError("Failed to load active orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div className="p-4">Loading active orders...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <ToastContainer />
      <h1 className={styles.header}>Active Orders</h1>

      {orders.length === 0 ? (
        <p className={styles.noOrders}>No active orders found.</p>
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
                    <span className="text-sm text-gray-600">{o.user?.phone}</span>
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
                    <span
                      className={`${styles.statusBadge} ${
                        o.status === "OUT_FOR_DELIVERY"
                          ? styles.statusOut
                          : styles.statusProcessing
                      }`}
                    >
                      {o.status}
                    </span>
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
