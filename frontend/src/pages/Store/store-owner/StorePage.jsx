import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/StorePage.module.css";
import { CartContext } from "../../admin/Context/CartContext";
import { AuthContext } from "../../admin/Context/AuthContext";
import FloatingCartButton from "../../../components/FloatingCartButton";

const StorePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { addToCart, cart, clearCart } = useContext(CartContext);
  const { userLoggedIn } = useContext(AuthContext);

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [adding, setAdding] = useState(null);

  // New states for “Clear & Add” modal
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  const stripHtml = (html) => html.replace(/<[^>]+>/g, "");

  useEffect(() => {
    const loadStore = async () => {
      try {
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

  const handleAddToCart = async (product) => {
    if (!userLoggedIn) return setShowLoginPopup(true);

    if (cart.items.some((i) => i.product._id === product._id)) return;

    setAdding(product._id);

    try {
      const result = await addToCart(product._id, 1);

      if (result?.conflict) {
        // Server said: conflict with another store
        setPendingProduct(product);
        setShowConflictModal(true);
        return;
      }

      navigate("/cart");
    } finally {
      setAdding(null);
    }
  };

  const confirmClearAndAdd = async () => {
    if (!pendingProduct) return;
    setShowConflictModal(false);
    await clearCart();
    await addToCart(pendingProduct._id, 1);
    setPendingProduct(null);
    navigate("/cart");
  };

  const handleBuyNow = (product) => {
    if (!userLoggedIn) return setShowLoginPopup(true);
    navigate("/checkout", { state: { buyNowProduct: product } });
  };

  const LoginPrompt = () => (
    <div className={styles.popupBackdrop}>
      <div className={styles.popupCard}>
        <h2>Please Login</h2>
        <p>You need to login to continue.</p>
        <div className={styles.popupActions}>
          <button
            className={styles.loginBtn}
            onClick={() => {
              navigate("/login");
              setShowLoginPopup(false);
            }}
          >
            Login
          </button>
          <button
            className={styles.cancelBtn}
            onClick={() => setShowLoginPopup(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const ConflictModal = () => (
    <div className={styles.popupBackdrop}>
      <div className={styles.popupCard}>
        <h2>Different Store Items</h2>
        <p>
          Your cart has items from another store. Clear it and add this product?
        </p>
        <div className={styles.popupActions}>
          <button className={styles.loginBtn} onClick={confirmClearAndAdd}>
            Clear & Add
          </button>
          <button
            className={styles.cancelBtn}
            onClick={() => {
              setShowConflictModal(false);
              setPendingProduct(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <p>Loading store...</p>;
  if (!store) return <p>Store not found.</p>;

  return (
    <div className={styles.container}>
      {showLoginPopup && <LoginPrompt />}
      {showConflictModal && <ConflictModal />}

      <FloatingCartButton />

      <div className={styles.header}>
        <img
          src={store.storeImage}
          alt={store.storeName}
          className={styles.storeImage}
        />
        <div className={styles.storeInfo}>
          <h1>{store.storeName}</h1>
          <p className={styles.address}>{store.address}</p>
          <p className={styles.timing}>
            {store.openingTime} - {store.closingTime}
          </p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Products</h2>
      <div className={styles.productsGrid}>
        {products.map((p) => {
          const inCart = cart.items.some((item) => item.product._id === p._id);
          return (
            <div key={p._id} className={styles.productCard}>
              <div className={styles.productImageWrapper}>
                {!p.inStock && (
                  <span className={styles.outOfStockBadge}>Out of Stock</span>
                )}
                <img
                  src={p.logo}
                  alt={p.name}
                  className={styles.productImage}
                />
              </div>

              <h3 className={styles.productTitle}>{p.name}</h3>
              {p.description && (
                <p className={styles.productDescription}>
                  {stripHtml(p.description).length > 80
                    ? stripHtml(p.description).substring(0, 80) + "..."
                    : stripHtml(p.description)}
                </p>
              )}

              <div className={styles.priceBox}>
                {p.discountPrice > 0 ? (
                  <>
                    <span className={styles.originalPrice}>₹{p.price}</span>
                    <span className={styles.discountPrice}>
                      ₹{p.discountPrice}
                    </span>
                    <span className={styles.discountTag}>
                      {Math.round(
                        ((p.price - p.discountPrice) / p.price) * 100
                      )}
                      % OFF
                    </span>
                  </>
                ) : (
                  <span className={styles.discountPrice}>₹{p.price}</span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  onClick={() => handleAddToCart(p)}
                  disabled={inCart || adding === p._id || !p.inStock}
                >
                  {inCart
                    ? "Added"
                    : adding === p._id
                    ? "Adding..."
                    : "Add to Cart"}
                </button>
                <button onClick={() => handleBuyNow(p)} disabled={!p.inStock}>
                  Buy Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StorePage;
