import React, { useContext, useState } from "react";
import API from "../../api/api";
import { CartContext } from "../admin/Context/CartContext";
import styles from "./css/Cart.module.css"; // import as module

const Cart = () => {
  const { cart, loading, updateItem, removeItem, clearCart } = useContext(CartContext);
  const [updatingItem, setUpdatingItem] = useState(null);

  const handleQuantityChange = async (productId, quantity) => {
    if (quantity < 1) return;
    setUpdatingItem(productId);
    try {
      await updateItem(productId, quantity);
    } catch {
      alert("Failed to update quantity.");
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm("Remove this item from cart?")) return;
    try {
      await removeItem(productId);
    } catch {
      alert("Failed to remove item.");
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Clear your cart?")) return;
    try {
      await clearCart();
    } catch {
      alert("Failed to clear cart.");
    }
  };

  if (loading) return <div className={`${styles.cartWrapper} ${styles.cartLoading}`}>Loading cart...</div>;
  if (!cart?.items?.length) return <div className={`${styles.cartWrapper} ${styles.cartEmpty}`}>Your cart is empty.</div>;

  const total = cart.items.reduce((sum, item) => sum + item.quantity * item.priceAtAddTime, 0);

  return (
    <div className={styles.cartWrapper}>
      <div className={styles.cartContainer}>
        <h1>Your Cart</h1>
        <button className={styles.clearBtn} onClick={handleClearCart}>Clear Cart</button>

        <table className={styles.cartTable}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
              <th>Remove</th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <tr key={item.product._id}>
                <td className={styles.productInfo}>
                  <img src={`${API.URL}/${item.product.logo}`} alt={item.product.name} className={styles.productImage} />
                  <span>{item.product.name}</span>
                </td>
                <td>₹{item.priceAtAddTime}</td>
                <td>
                  <div className={styles.quantityControls}>
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
                </td>
                <td>₹{item.quantity * item.priceAtAddTime}</td>
                <td>
                  <button onClick={() => handleRemoveItem(item.product._id)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.cartTotal}>
          <h2>Total: ₹{total}</h2>
          <button className={styles.checkoutBtn}>Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
