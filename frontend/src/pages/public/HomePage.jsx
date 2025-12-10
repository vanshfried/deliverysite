import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import styles from "./css/HomePage.module.css";
import FloatingCartButton from "../../components/FloatingCartButton";
const HomePage = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await API.get("/stores");
        setStores(res.data.stores || []);
      } catch (err) {
        console.error("Error fetching stores:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading) return <p className={styles.hpLoading}>Loading stores...</p>;
  if (!stores.length)
    return <p className={styles.hpLoading}>No stores found.</p>;

  return (
    <div className={styles.hpContainer}>
      <h1>Stores</h1>
      <FloatingCartButton />
      <div className={styles.hpGrid}>
        {stores.map((store) => (
          <div
            key={store._id}
            className={styles.hpCard}
            onClick={() => navigate(`/store/${store.slug}`)}
          >
            <div className={styles.hpImage}>
              <img
                src={
                  store.storeImage?.startsWith("data:image")
                    ? store.storeImage // base64 (working)
                    : `${API.URL}/uploads/${store.storeImage}` // file (future-proof)
                }
                alt={store.storeName}
              />
            </div>

            <div className={styles.hpInfo}>
              <h2>{store.storeName}</h2>
              <p>{store.address || "No address added yet"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
