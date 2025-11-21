import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import styles from "../css/StorePage.module.css";

const StorePage = () => {
  const { slug } = useParams(); // ✅ Use slug instead of id
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStore = async () => {
      try {
        // 🔥 Uses /store/:slug route now
        const res = await API.get(`/store/${slug}`);

        setStore(res.data.store);
        setProducts(res.data.products);
      } catch (err) {
        console.error("Store load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStore();
  }, [slug]);

  if (loading) return <p>Loading store...</p>;
  if (!store) return <p>Store not found.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={store.storeImage} alt={store.storeName} />
        <div>
          <h1>{store.storeName}</h1>
          <p>{store.address}</p>
          <p>
            {store.openingTime} - {store.closingTime}
          </p>
        </div>
      </div>

      <h2>Products</h2>

      <div className={styles.productsGrid}>
        {products.map((p) => (
          <div key={p._id} className={styles.productCard}>
            <img src={p.logo} alt={p.name} />
            <h3>{p.name}</h3>
            <p>₹{p.price}</p>
            {p.discountPrice > 0 && <p>Discount: ₹{p.discountPrice}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorePage;
