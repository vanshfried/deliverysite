// StoreProductsPage.jsx
import React, { useEffect, useState } from "react";
import { getStoreProducts, deleteProduct } from "../api/storeProducts";
import { useNavigate } from "react-router-dom";
import styles from "../css/StoreProductsPage.module.css";
import StoreOwnerLayout from "../components/StoreOwnerLayout"; // use layout now

export default function StoreProductsPage() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  // Load all products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await getStoreProducts();
        if (res?.data?.products) setProducts(res.data.products);
      } catch (err) {
        console.error(err);
      }
    };
    loadProducts();
  }, []);

  // Delete a product
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
      const res = await deleteProduct(id);
      if (res?.data?.message) {
        setProducts(products.filter((p) => p._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stripHtml = (html) => html.replace(/<[^>]+>/g, "");

  return (
    <StoreOwnerLayout>
    <div className={styles.pageContainer}>
      
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className={styles.productsGrid}>
          {products.map((product) => {
            const cleanDesc = stripHtml(product.description || "");
            const preview = cleanDesc.length > 100 ? cleanDesc.slice(0, 100) + "..." : cleanDesc;

            return (
              <div key={product._id} className={styles.productCard}>
                {product.logo ? (
                  <img src={product.logo} alt={product.name} className={styles.productImage} />
                ) : (
                  <div className={styles.noImage}>No Image</div>
                )}
                <div className={styles.productInfo}>
                  <h3>{product.name}</h3>
                  <p><strong>Price:</strong> ₹{product.price}</p>
                  {cleanDesc && <p className={styles.productDesc}>{preview}</p>}
                </div>
                <div className={styles.productActions}>
                  <button
                    onClick={() => navigate(`/store-owner/products/edit/${product._id}`)}
                    className={styles.editButton}
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
          })}
        </div>
      )}
    </div>
    </StoreOwnerLayout>
  );
}
