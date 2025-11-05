import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../css/AdminUserDetailsPage.module.css";
import API from "../../../api/api";

export default function AdminUserDetailsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await API.get(`/api/admin/users/${id}`);
        if (res && res.data.success) {
          const { stats, orders } = res.data;
          const biggestPurchase = orders.length
            ? Math.max(...orders.map((o) => o.totalAmount))
            : 0;
          const avgSpent =
            stats.totalOrders > 0
              ? (stats.totalSpent / stats.totalOrders).toFixed(0)
              : 0;

          setData({
            ...res.data,
            extra: { biggestPurchase, avgSpent },
          });
        }
      } catch (err) {
        console.error("❌ Failed to fetch user details:", err);
        alert("Server error while fetching user details");
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [id]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!data) return <div className={styles.error}>User not found</div>;

  const { user, stats, orders, extra } = data;

  return (
    <div className={styles.container}>
      <div className={styles.userHeader}>
        <div className={styles.userInfo}>
          <button onClick={() => navigate(-1)} className={styles.backBtnInline}>
            ← Back to All Users
          </button>
          <div className={styles.nameRow}>
            <h1>{user.name}</h1>
          </div>
          <p className={styles.phone}>{user.phone}</p>
        </div>
        <div className={styles.overviewStats}>
          <div className={styles.statBox}>
            <span>Total Orders</span>
            <strong>{stats.totalOrders}</strong>
          </div>
          <div className={styles.statBox}>
            <span>Total Spent</span>
            <strong>₹{stats.totalSpent}</strong>
          </div>
          <div className={styles.statBox}>
            <span>Average Spent / Order</span>
            <strong>₹{extra.avgSpent}</strong>
          </div>
          <div className={styles.statBox}>
            <span>Biggest Purchase</span>
            <strong>₹{extra.biggestPurchase}</strong>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* LEFT COLUMN — ORDERS FIRST */}
        <div className={styles.left}>
          <div className={styles.card}>
            <h2>Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className={styles.empty}>No orders found.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .sort(
                        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                      )
                      .map((o) => (
                        <tr
                          key={o._id}
                          className={
                            o.totalAmount === extra.biggestPurchase
                              ? styles.highlight
                              : ""
                          }
                        >
                          <td className={styles.slug}>{o.slug}</td>
                          <td>₹{o.totalAmount}</td>
                          <td>{o.paymentMethod}</td>
                          <td>{o.status || "—"}</td>
                          <td>{new Date(o.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — ADDRESSES */}
        <div className={styles.right}>
          <div className={styles.card}>
            <h2>Addresses</h2>
            {user.addresses.length > 0 ? (
              user.addresses.map((a) => (
                <div key={a._id} className={styles.address}>
                  <p>
                    {a.houseNo}, {a.laneOrSector}
                  </p>
                  <p>{a.landmark}</p>
                  <p>Pincode: {a.pincode}</p>
                  {user.defaultAddress === a._id && (
                    <span className={styles.defaultTag}>Default</span>
                  )}
                </div>
              ))
            ) : (
              <p className={styles.empty}>No addresses added.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
