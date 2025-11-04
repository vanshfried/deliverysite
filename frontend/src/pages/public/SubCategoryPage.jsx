import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import API from "../../api/api";
import styles from "./css/SubCategoryPage.module.css";

const SubCategoryPage = () => {
  const { slug } = useParams(); // ✅ use slug instead of id
  const { state } = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get(`/products/subcategory/slug/${slug}`);
        setProducts(res.data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [slug]);

  if (loading)
    return <p className={styles.scpLoadingText}>Loading products...</p>;
  if (!products.length)
    return <p className={styles.scpLoadingText}>No products found.</p>;

  return (
    <div className={styles.scpContainer}>
      {/* Breadcrumb */}
      <nav className={styles.scpBreadcrumb}>
        <Link to="/">Home</Link> &gt;{" "}
        <span>{state?.name || "Subcategory"}</span>
      </nav>

      <h1 className={styles.scpTitle}>
        {state?.name || "Subcategory Products"}
      </h1>

      <div className={styles.scpProductsGrid}>
        {products.map((product) => (
          <div
            key={product._id}
            className={styles.scpProductCard}
            onClick={() =>
              navigate(`/product/${product.slug}`, {
                state: { name: product.name },
              })
            }
          >
            <div className={styles.scpProductImage}>
              <img src={`${API.URL}/${product.logo}`} alt={product.name} />
            </div>
            <div className={styles.scpProductInfo}>
              <h2>{product.name}</h2>
              {/* ⭐ Add Rating Display */}
              <p className={styles.hpRating}>
                ⭐{" "}
                {product.averageRating
                  ? product.averageRating.toFixed(1)
                  : "0.0"}{" "}
                ({product.numReviews || 0})
              </p>
              <p className={styles.scpPrice}>
                {product.discountPrice > 0 ? (
                  <>
                    <span className={styles.scpOriginalPrice}>
                      ₹{product.price}
                    </span>
                    <span className={styles.scpDiscountPrice}>
                      ₹{product.discountPrice}
                    </span>
                  </>
                ) : (
                  <span>₹{product.price}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubCategoryPage;
