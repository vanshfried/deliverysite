import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/AllUsersPage.module.css";
import API from "../../../api/api";

export default function AllUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/api/admin/users");
        if (res && res.data.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.error("❌ Failed to fetch users:", err);
        alert("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>All Users</h1>
        <p>Overview of all registered users and their activity.</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Spent</th>
              <th>Recent Order</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className={styles.empty}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u._id}
                  onClick={() => navigate(`/admin/user/${u._id}`)}
                  className={styles.row}
                >
                  <td>{u.name}</td>
                  <td>{u.phone}</td>
                  <td>{u.orderCount}</td>
                  <td>₹{u.totalSpent}</td>
                  <td>
                    {u.recentOrder
                      ? new Date(u.recentOrder.date).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
