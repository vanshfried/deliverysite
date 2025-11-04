import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import { AuthContext } from "../../admin/Context/AuthContext";
import styles from "./css/Orders.module.css";

export default function Orders() {
  const { userLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userLoggedIn) return navigate("/login");

    const fetchOrders = async () => {
      try {
        const res = await API.get("/orders/my");
        setOrders(res.data.orders || []);
      } catch {
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userLoggedIn, navigate]);

  if (loading) return <p className={styles.loading}>Loading your orders...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  if (orders.length === 0) {
    return (
      <div className={styles.emptyOrders}>
        <img src="/empty-box.png" alt="No Orders" className={styles.emptyImg} />
        <h2>No Orders Yet</h2>
        <p>When you place an order, it will appear here.</p>
        <button onClick={() => navigate("/")} className={styles.shopNowBtn}>
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className={styles.ordersContainer}>
      <h1 className={styles.title}>My Orders</h1>

      <div className={styles.ordersGrid}>
        {orders.map((order) => (
          <div
            key={order._id}
            className={styles.orderCard}
            onClick={() => navigate(`/orders/${order.slug}`)}
          >
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.orderId}>Placed On :-</p>
                <p className={styles.date}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`${styles.status} ${
                  styles[order.status.toLowerCase()]
                }`}
              >
                {order.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className={styles.itemsPreview}>
              {order.items.slice(0, 2).map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemQty}>× {item.quantity}</p>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className={styles.moreItems}>
                  +{order.items.length - 2} more item
                  {order.items.length - 2 > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div className={styles.cardFooter}>
              <p className={styles.total}>₹{order.totalAmount.toFixed(2)}</p>
              <p className={styles.payment}>
                {order.paymentMethod} ({order.paymentStatus})
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
