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
          setData(res.data);
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

  const { user, stats, orders } = data;

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)} className={styles.backBtn}>
        ← Back to All Users
      </button>

      <div className={styles.grid}>
        {/* Left column */}
        <div className={styles.left}>
          <div className={styles.card}>
            <h2>User Info</h2>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Phone:</strong> {user.phone}</p>
          </div>

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

        {/* Right column */}
        <div className={styles.right}>
          <div className={styles.card}>
            <h2>Summary</h2>
            <div className={styles.summary}>
              <div>
                <p className={styles.label}>Total Orders</p>
                <p className={styles.value}>{stats.totalOrders}</p>
              </div>
              <div>
                <p className={styles.label}>Total Spent</p>
                <p className={styles.value}>₹{stats.totalSpent}</p>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Orders</h2>
            {orders.length === 0 ? (
              <p className={styles.empty}>No orders found.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order Name</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o._id}>
                        <td className={styles.slug}>{o.slug}</td>
                        <td>₹{o.totalAmount}</td>
                        <td>{o.paymentMethod}</td>
                        <td>{new Date(o.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
