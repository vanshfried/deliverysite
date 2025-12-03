import React, { useEffect, useState } from "react";
import API from "../api/api";
import styles from "../css/StoreOrders.module.css";

const StoreOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get("/store-owner/orders/list");
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAccept = async (orderId) => {
    try {
      await API.patch(`/store-owner/orders/accept/${orderId}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (orderId) => {
    try {
      await API.patch(`/store-owner/orders/reject/${orderId}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div className={styles.container}>Loading orders...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Store Orders</h2>

      {orders.length === 0 ? (
        <p className={styles.noOrders}>No orders found.</p>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div key={order._id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <h3>Order #{order.slug}</h3>
                <span
                  className={`${styles.orderStatus} ${
                    order.status === "PENDING"
                      ? styles.statusPending
                      : order.status === "ACCEPTED"
                      ? styles.statusAccepted
                      : styles.statusRejected
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <p>
                <strong>Total:</strong> ₹{order.totalAmount}
              </p>
              <p>
                <strong>Customer:</strong> {order.user?.name}
              </p>

              <h4>Items:</h4>
              <ul className={styles.itemsList}>
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} × {item.quantity} — ₹{item.price}
                  </li>
                ))}
              </ul>

              {order.status === "PENDING" && (
                <div className={styles.actions}>
                  <button
                    onClick={() => handleAccept(order._id)}
                    className={`${styles.button} ${styles.accept}`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(order._id)}
                    className={`${styles.button} ${styles.reject}`}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreOrders;
