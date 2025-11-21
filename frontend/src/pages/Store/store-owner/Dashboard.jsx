import React, { useEffect, useState } from "react";
import { storeOwnerMe } from "../api/storeOwner";
import { Link } from "react-router-dom";

export default function StoreOwnerDashboard() {
  const [owner, setOwner] = useState(null);
  const [store, setStore] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await storeOwnerMe();
      if (res?.data) {
        setOwner(res.data.owner);
        setStore(res.data.store);
      }
    };

    fetchData();
  }, []);

  if (!owner) return <p>Loading...</p>;

  return (
    <div style={styles.container}>

      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.title}>Store Panel</h2>

        <Link to="/store-owner/dashboard" style={styles.link}>
          Dashboard
        </Link>

        <Link to="/store-owner/store-profile" style={styles.link}>
          Store Profile
        </Link>

        <Link to="/store-owner/products" style={styles.link}>
          Store Products
        </Link>

        <Link to="/store-owner/logout" style={styles.logoutLink}>
          Logout
        </Link>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <h1>Welcome, {owner.fullName}</h1>
        <p>Phone: {owner.phone}</p>

        <div style={styles.card}>
          <h2>Your Store</h2>

          {store ? (
            <div>
              {store.storeImage ? (
                <img src={store.storeImage} alt="Store" style={styles.storeImage} />
              ) : (
                <div>No store image</div>
              )}

              <p><strong>Name:</strong> {store.storeName}</p>
              <p><strong>Address:</strong> {store.address || "Not set"}</p>
              <p><strong>Description:</strong> {store.description || "Not provided"}</p>
              <p>
                <strong>Timing:</strong>{" "}
                {store.openingTime && store.closingTime
                  ? `${store.openingTime} - ${store.closingTime}`
                  : "Not set"}
              </p>

              <Link
                to="/store-owner/store-profile"
                style={styles.editButton}
              >
                Edit Store Profile
              </Link>
            </div>
          ) : (
            <p>No store found.</p>
          )}
        </div>

        <div style={styles.card}>
          <h2>Products</h2>
          <Link to="/store-owner/products/create" style={styles.productButton}>
            Create Products
          </Link>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
  },

  sidebar: {
    width: "220px",
    background: "#222",
    color: "#fff",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
  },

  title: {
    marginBottom: "30px",
  },

  link: {
    color: "#fff",
    textDecoration: "none",
    marginBottom: "15px",
    fontSize: "16px",
  },

  logoutLink: {
    marginTop: "auto",
    color: "red",
    textDecoration: "none",
  },

  main: {
    flex: 1,
    padding: "30px",
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
  },

  storeImage: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    marginBottom: "15px",
  },

  editButton: {
    display: "inline-block",
    padding: "8px 15px",
    background: "#007bff",
    color: "#fff",
    marginTop: "10px",
    textDecoration: "none",
    borderRadius: "5px",
  },

  productButton: {
    padding: "10px 15px",
    background: "green",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "5px",
  },
};
