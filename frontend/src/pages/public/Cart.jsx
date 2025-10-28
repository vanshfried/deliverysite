import React, { useContext, useState } from "react";
import API from "../../api/api";
import { CartContext } from "../admin/Context/CartContext";
import styles from "./css/Cart.module.css";

const Cart = () => {
  const { cart, loading, updateItem, removeItem, clearCart } = useContext(CartContext);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  const handleQuantityChange = async (productId, quantity) => {
    if (quantity < 1) return;
    setUpdatingItem(productId);
    try {
      await updateItem(productId, quantity);
    } catch {
      showError("Failed to update quantity");
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await removeItem(productId);
    } catch {
      showError("Failed to remove item");
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch {
      showError("Failed to clear cart");
    }
  };

  if (loading) return <div className={styles.statusBox}>Loading your cart...</div>;
  if (!cart?.items?.length) return <div className={styles.statusBox}>Your Amazon Cart is empty</div>;

  const total = cart.items.reduce((sum, item) => sum + item.quantity * item.priceAtAddTime, 0);

  const isFreeDelivery = total >= 499;
  const remainingForFree = 499 - total;

  return (
    <div className={styles.cartWrapper}>
      {errorMsg && <div className={styles.errorToast}>{errorMsg}</div>}

      <div className={styles.cartList}>
        {cart.items.map((item) => (
          <div key={item.product._id} className={styles.cartItem}>
            <img
              src={`${API.URL}/${item.product.logo}`}
              alt={item.product.name}
              className={styles.productImage}
            />

            <div className={styles.details}>
              <h3>{item.product.name}</h3>
              <p className={styles.price}>₹{item.priceAtAddTime}</p>

              <div className={styles.controls}>
                <button
                  onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                  disabled={updatingItem === item.product._id || item.quantity <= 1}
                >-</button>

                <span>{item.quantity}</span>

                <button
                  onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                  disabled={updatingItem === item.product._id}
                >+</button>
              </div>

              <button className={styles.removeBtn} onClick={() => handleRemoveItem(item.product._id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.cartTotalBox}>
        {isFreeDelivery ? (
          <p className={styles.freeDeliveryText}>✅ FREE Delivery available</p>
        ) : (
          <p className={styles.deliveryHint}>
            Add ₹{remainingForFree} more for FREE Delivery 🚚
          </p>
        )}

        <h2>Subtotal ({cart.items.length} items): ₹{total}</h2>
        <button className={styles.checkoutBtn}>Proceed to Buy</button>
        <button className={styles.clearBtn} onClick={handleClearCart}>Clear Cart</button>
      </div>
    </div>
  );
};

export default Cart;
