import React, { useEffect, useState } from "react";
import { storeOwnerMe } from "../api/storeOwner";
import { Link, useNavigate } from "react-router-dom";

// 👇 you already created these API functions
import { getStoreProducts, deleteProduct } from "../api/storeProducts";

export default function StoreOwnerDashboard() {
  const [owner, setOwner] = useState(null);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);

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

        {/* Store Details Card */}
        <div style={styles.card}>
          <h2>Your Store</h2>

          {store ? (
            <div>
              {store.storeImage ? (
                <img
                  src={store.storeImage}
                  alt="Store"
                  style={styles.storeImage}
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

              <Link to="/store-owner/store-profile" style={styles.editButton}>
                Edit Store Profile
              </Link>
            </div>
          ) : (
            <p>No store found.</p>
          )}
        </div>

        {/* Products Card */}
        <div style={styles.card}>
          <h2>Products</h2>

          <Link to="/store-owner/products/create" style={styles.productButton}>
            Create Products
          </Link>

          {/* Product List */}
          <div style={{ marginTop: "20px" }}>
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
                  <div key={product._id} style={styles.productItem}>
                    {product.logo ? (
                      <img
                        src={product.logo}
                        alt={product.name}
                        style={styles.productImage}
                      />
                    ) : (
                      <div style={styles.noImageBox}>No Image</div>
                    )}

                    <div style={{ flex: 1 }}>
                      <h3>{product.name}</h3>
                      <p>₹{product.price}</p>

                      {cleanDesc && <p style={{ color: "gray" }}>{preview}</p>}
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() =>
                          navigate(`/store-owner/products/edit/${product._id}`)
                        }
                        style={styles.editButtonSmall}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(product._id)}
                        style={styles.deleteButton}
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
      </main>
    </div>
  );
}

// -------------------- STYLES --------------------
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

  productItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    marginBottom: "10px",
    background: "#fafafa",
  },

  productImage: {
    width: "60px",
    height: "60px",
    borderRadius: "5px",
    objectFit: "cover",
    marginRight: "15px",
    border: "1px solid #ccc",
  },

  noImageBox: {
    width: "60px",
    height: "60px",
    background: "#eee",
    borderRadius: "5px",
    marginRight: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #ccc",
    fontSize: "12px",
    color: "#888",
  },

  editButtonSmall: {
    padding: "6px 10px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  deleteButton: {
    padding: "6px 10px",
    background: "red",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
