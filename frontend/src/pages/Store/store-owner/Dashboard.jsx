import React, { useEffect, useState } from "react";
import { storeOwnerMe } from "../api/storeOwner";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api"; // <-- Added
import { getStoreProducts, deleteProduct } from "../api/storeProducts";
import styles from "../css/StoreOwnerDashboard.module.css";
export default function StoreOwnerDashboard() {
  const [owner, setOwner] = useState(null);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]); // <-- Added

  const navigate = useNavigate();
  const stripHtml = (html) => html.replace(/<[^>]+>/g, "");

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

  // load products ----------------------
  useEffect(() => {
    const loadProducts = async () => {
      const res = await getStoreProducts();
      if (res?.data?.products) {
        setProducts(res.data.products);
      }
    };

    loadProducts();
  }, []);

  // load recent orders ----------------------
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await API.get("/store-owner/orders/list");
        if (res?.data?.orders) {
          setRecentOrders(res.data.orders.slice(0, 10)); // latest 10
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadOrders();
  }, []);

  // accept order ----------------------
  const acceptOrder = async (id) => {
    try {
      await API.patch(`/store-owner/orders/accept/${id}`);
      setRecentOrders(
        recentOrders.map((o) =>
          o._id === id ? { ...o, status: "ACCEPTED" } : o
        )
      );
    } catch (err) {
      console.error(err);
    }
  };
  // reject order ----------------------
  const rejectOrder = async (id) => {
    try {
      await API.patch(`/store-owner/orders/reject/${id}`);
      setRecentOrders(
        recentOrders.map((o) =>
          o._id === id ? { ...o, status: "REJECTED" } : o
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // delete product ---------------------
  const handleDelete = async (id) => {
    const ok = window.confirm("Do you really want to delete this product?");
    if (!ok) return;

    const res = await deleteProduct(id);

    if (res?.data?.message) {
      setProducts(products.filter((p) => p._id !== id));
    }
  };

  if (!owner) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h2 className={styles.title}>Store Panel</h2>

        <Link to="/store-owner/dashboard" className={styles.link}>
          Dashboard
        </Link>
        <Link to="/store-owner/store-profile" className={styles.link}>
          Store Profile
        </Link>
        <Link to="/store-owner/products" className={styles.link}>
          Store Products
        </Link>
        <Link to="/store-owner/orders" className={styles.link}>
          Store Orders
        </Link>

        <Link to="/store-owner/logout" className={styles.logoutLink}>
          Logout
        </Link>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <h1>Welcome, {owner.fullName}</h1>
        <p>Phone: {owner.phone}</p>

        {/* Store Card */}
        <div className={styles.card}>
          <h2>Your Store</h2>

          {store ? (
            <div>
              {store.storeImage ? (
                <img
                  src={store.storeImage}
                  alt="Store"
                  className={styles.storeImage}
                />
              ) : (
                <div>No store image</div>
              )}

              <p>
                <strong>Name:</strong> {store.storeName}
              </p>
              <p>
                <strong>Address:</strong> {store.address || "Not set"}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {store.description || "Not provided"}
              </p>

              <p>
                <strong>Timing:</strong>{" "}
                {store.openingTime && store.closingTime
                  ? `${store.openingTime} - ${store.closingTime}`
                  : "Not set"}
              </p>

              <Link
                to="/store-owner/store-profile"
                className={styles.editButton}
              >
                Edit Store Profile
              </Link>
            </div>
          ) : (
            <p>No store found.</p>
          )}
        </div>

        {/* Products Card */}
        <div className={styles.card}>
          <h2>Products</h2>

          <Link
            to="/store-owner/products/create"
            className={styles.productButton}
          >
            Create Products
          </Link>

          <div className={styles.productsContainer}>
            {products.length === 0 ? (
              <p>No products yet.</p>
            ) : (
              products.map((product) => {
                const cleanDesc = stripHtml(product.description).trim();
                const preview =
                  cleanDesc.length > 80
                    ? cleanDesc.slice(0, 80) + "..."
                    : cleanDesc;

                return (
                  <div key={product._id} className={styles.productItem}>
                    {product.logo ? (
                      <img
                        src={product.logo}
                        alt={product.name}
                        className={styles.productImage}
                      />
                    ) : (
                      <div className={styles.noImageBox}>No Image</div>
                    )}

                    <div className={styles.productInfo}>
                      <h3>{product.name}</h3>
                      <p>₹{product.price}</p>
                      {cleanDesc && (
                        <p className={styles.productDesc}>{preview}</p>
                      )}
                    </div>

                    <div className={styles.productActions}>
                      <button
                        onClick={() =>
                          navigate(`/store-owner/products/edit/${product._id}`)
                        }
                        className={styles.editButtonSmall}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(product._id)}
                        className={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Orders Card */}
        <div className={styles.card}>
          <h2>Recent Orders (10)</h2>

          <Link to="/store-owner/orders" className={styles.productButton}>
            View All Orders
          </Link>

          {recentOrders.length === 0 ? (
            <p>No recent orders.</p>
          ) : (
            recentOrders.map((order) => (
              <div key={order._id} className={styles.orderItem}>
                <h3>Order #{order.slug}</h3>
                <p>
                  <strong>Total:</strong> ₹{order.totalAmount}
                </p>
                <p>
                  <strong>Status:</strong> {order.status}
                </p>

                {order.status === "PENDING" && (
                  <div className={styles.orderButtons}>
                    <button
                      onClick={() => acceptOrder(order._id)}
                      className={styles.acceptButton}
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => rejectOrder(order._id)}
                      className={styles.rejectButton}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
