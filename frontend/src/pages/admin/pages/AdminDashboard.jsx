import React, { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";
import { Link } from "react-router-dom";
import styles from "../css/AdminDashboard.module.css"; // <-- module import

function AdminDashboard() {
  const { admin, loading } = useContext(AuthContext);

  if (loading) return <p className={styles.loadingText}>Loading...</p>;

  const dashboardActions = [
    { title: "View Users", value: "All Users", link: "/admin/users" },
    { title: "Delivery Applicants", value: "Delivery Applicants", link: "/admin/delivery-applicants" },
    { title: "All Delivery Boys", value: "All Delivery Boys", link: "/admin/All-delivery-boys" },
    { title: "All Store Applications", value: "All Delivery Boys", link: "/admin/store-applications" }
  ];

  return (
    <div className={styles.adminDashboard}>
      <header>
        <h1>Welcome to the Admin Dashboard {admin?.username || "Admin"}</h1>
      </header>

      <div className={styles.dashboardCards}>
        {dashboardActions.map((action, idx) => (
          <Link key={idx} to={action.link} className={styles.dashboardCard}>
            <h2>{action.title}</h2>
            <p>{action.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
