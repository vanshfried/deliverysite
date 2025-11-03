import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import styles from "./css/HomePage.module.css";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get("/products");
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <p className={styles.hpLoading}>Loading products...</p>;
  if (!products.length) return <p className={styles.hpLoading}>No products found.</p>;

  return (
    <div className={styles.hpContainer}>
      <h1>Our Products</h1>
      <div className={styles.hpGrid}>
        {products.map((product) => (
          <div
            key={product._id}
            className={styles.hpCard}
            onClick={() => navigate(`/product/${product.slug}`)}
          >
            <div className={styles.hpImage}>
              <img src={`${API.URL}/${product.logo}`} alt={product.name} />
            </div>
            <div className={styles.hpInfo}>
              <h2>{product.name}</h2>
              
              {/* ⭐ Add Rating Display */}
              <p className={styles.hpRating}>
                ⭐ {product.averageRating ? product.averageRating.toFixed(1) : "0.0"}{" "}
                ({product.numReviews || 0})
              </p>

              <p className={styles.hpPrice}>
                {product.discountPrice > 0 ? (
                  <>
                    <span className={styles.hpOriginalPrice}>₹{product.price}</span>
                    <span className={styles.hpDiscountPrice}>₹{product.discountPrice}</span>
                  </>
                ) : (
                  <span className={styles.hpDiscountPrice}>₹{product.price}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
