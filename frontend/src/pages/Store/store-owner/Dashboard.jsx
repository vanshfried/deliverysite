// StoreOwnerDashboard.jsx
import React, { useEffect, useState } from "react";
import { storeOwnerMe } from "../api/storeOwner";
import { getStoreProducts, deleteProduct } from "../api/storeProducts";
import API from "../api/api";
import { Link, useNavigate } from "react-router-dom";
import StoreOwnerLayout from "../components/StoreOwnerLayout"; // use layout now
import styles from "../css/StoreOwnerDashboard.module.css";

export default function StoreOwnerDashboard() {
  const [owner, setOwner] = useState(null);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
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

  useEffect(() => {
    const loadProducts = async () => {
      const res = await getStoreProducts();
      if (res?.data?.products) setProducts(res.data.products);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await API.get("/store-owner/orders/list");
        if (res?.data?.orders) setRecentOrders(res.data.orders.slice(0, 10));
      } catch (err) {
        console.error(err);
      }
    };
    loadOrders();
  }, []);

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

  const handleDelete = async (id) => {
    const ok = window.confirm("Do you really want to delete this product?");
    if (!ok) return;

    const res = await deleteProduct(id);
    if (res?.data?.message) setProducts(products.filter((p) => p._id !== id));
  };

  if (!owner) return <p>Loading...</p>;

  return (
    <StoreOwnerLayout>
      {/* Dashboard content */}
      <div className={styles.pageHeader}>
        <h1 className={styles.ownerName}>Welcome, {owner.fullName}</h1>
        <p className={styles.ownerInfo}>Phone: {owner.phone}</p>
      </div>

      {/* Store Info */}
      <div className={`${styles.card} ${styles.smallStoreCard}`}>
        <div className={styles.sectionHeader}>
          <h2>Your Store</h2>
        </div>
        {store ? (
          <div className={styles.storeRow}>
            {store.storeImage ? (
              <img
                src={store.storeImage}
                alt="Store"
                className={styles.storeImageSmall}
              />
            ) : (
              <div className={styles.noStoreImage}>No image</div>
            )}
            <div className={styles.storeDetails}>
              <p>
                <strong>Name:</strong> {store.storeName}
              </p>
              <p>
                <strong>Address:</strong> {store.address || "Not set"}
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
          </div>
        ) : (
          <p>No store found.</p>
        )}
      </div>

      {/* Recent Orders */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2>Recent Orders</h2>
          <Link to="/store-owner/orders" className={styles.viewAll}>
            View All
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p>No orders yet.</p>
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

      {/* Products */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h2>Products</h2>
          <Link
            to="/store-owner/products/create"
            className={styles.productButton}
          >
            Create Product
          </Link>
        </div>
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

                    {/* PRICE WITH DISCOUNT LOGIC */}
                    <div className={styles.priceBox}>
                      {product.discountPrice > 0 &&
                      product.discountPrice < product.price ? (
                        <>
                          <span className={styles.originalPrice}>
                            ₹{product.price}
                          </span>
                          <span className={styles.discountPrice}>
                            ₹{product.discountPrice}
                          </span>
                          <span className={styles.discountTag}>
                            {Math.round(
                              ((product.price - product.discountPrice) /
                                product.price) *
                                100
                            )}
                            % OFF
                          </span>
                        </>
                      ) : (
                        <span className={styles.discountPrice}>
                          ₹{product.price}
                        </span>
                      )}
                    </div>

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
    </StoreOwnerLayout>
  );
}
