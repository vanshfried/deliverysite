import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import { AuthContext } from "../../admin/Context/AuthContext";
import styles from "./css/OrderDetail.module.css";

export default function OrderDetail() {
  const { slug } = useParams(); // ✅ using slug now
  const { userLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userLoggedIn) return navigate("/login");

    const fetchOrder = async () => {
      try {
        const res = await API.get(`/orders/${slug}`); // ✅ fetch by slug
        setOrder(res.data.order);
      } catch {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [slug, userLoggedIn, navigate]);

  if (loading) return <p className={styles.loading}>Loading order...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!order) return <p className={styles.error}>Order not found</p>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/orders")}>
          ← Back
        </button>
        <h1>Order #{order.slug || "UNKNOWN"}</h1>

      </div>

      <div className={styles.grid}>
        {/* Order summary */}
        <div className={styles.card}>
          <h3>Order Summary</h3>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`${styles.status} ${styles[order.status.toLowerCase()]}`}
            >
              {order.status.replaceAll("_", " ")}
            </span>
          </p>
          <p>
            <strong>Placed On:</strong>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>
          <p>
            <strong>Total Amount:</strong> ₹{order.totalAmount.toFixed(2)}
          </p>
        </div>

        {/* Payment info */}
        <div className={styles.card}>
          <h3>Payment Info</h3>
          <p>
            <strong>Method:</strong> {order.paymentMethod}
          </p>
          <p>
            <strong>Status:</strong> {order.paymentStatus}
          </p>
        </div>

        {/* Delivery address */}
        <div className={styles.card}>
          <h3>Delivery Address :-</h3>
          <p>
            {order.deliveryAddress.houseNo}, {order.deliveryAddress.laneOrSector}
            {order.deliveryAddress.landmark
              ? `, ${order.deliveryAddress.landmark}`
              : ""}
          </p>
          <p>Pincode: {order.deliveryAddress.pincode}</p>
        </div>

        {/* Items */}
        <div className={`${styles.card} ${styles.itemsCard}`}>
          <h3>Items</h3>
          {order.items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemQty}>
                  Qty: {item.quantity} × ₹{item.price}
                </p>
              </div>
              <p className={styles.itemPrice}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className={styles.card}>
          <h3>Order Timeline</h3>
          <ul className={styles.timeline}>
            <li>
              <strong>Created:</strong>{" "}
              {new Date(order.timestampsLog.createdAt).toLocaleString()}
            </li>
            {order.timestampsLog.acceptedAt && (
              <li>
                <strong>Accepted:</strong>{" "}
                {new Date(order.timestampsLog.acceptedAt).toLocaleString()}
              </li>
            )}
            {order.timestampsLog.outForDeliveryAt && (
              <li>
                <strong>Out for Delivery:</strong>{" "}
                {new Date(order.timestampsLog.outForDeliveryAt).toLocaleString()}
              </li>
            )}
            {order.timestampsLog.deliveredAt && (
              <li>
                <strong>Delivered:</strong>{" "}
                {new Date(order.timestampsLog.deliveredAt).toLocaleString()}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
