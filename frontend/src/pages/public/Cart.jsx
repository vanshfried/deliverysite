import React, { useContext, useState } from "react";
import API from "../../api/api";
import { CartContext } from "../admin/Context/CartContext";
import "./css/Cart.css";

const Cart = () => {
  const { cart, loading, updateItem, removeItem, clearCart } = useContext(CartContext);
  const [updatingItem, setUpdatingItem] = useState(null);

  const handleQuantityChange = async (productId, quantity) => {
    if (quantity < 1) return;
    setUpdatingItem(productId);
    try {
      await updateItem(productId, quantity);
    } catch (err) {
      alert("Failed to update quantity.");
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm("Remove this item from cart?")) return;
    try {
      await removeItem(productId);
    } catch (err) {
      alert("Failed to remove item.");
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Clear your cart?")) return;
    try {
      await clearCart();
    } catch (err) {
      alert("Failed to clear cart.");
    }
  };

  if (loading) return <div className="cart-page-wrapper cart-loading">Loading cart...</div>;
  if (!cart?.items?.length) return <div className="cart-page-wrapper cart-empty">Your cart is empty.</div>;

  const total = cart.items.reduce((sum, item) => sum + item.quantity * item.priceAtAddTime, 0);

  return (
    <div className="cart-page-wrapper">
      <div className="cart-container">
        <h1>Your Cart</h1>
        <button className="clear-cart-btn" onClick={handleClearCart}>Clear Cart</button>

        <table className="cart-table">
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
                <td className="product-info">
                  <img src={`${API.URL}/${item.product.logo}`} alt={item.product.name} className="product-image" />
                  <span>{item.product.name}</span>
                </td>
                <td>₹{item.priceAtAddTime}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    disabled={updatingItem === item.product._id}
                    onChange={(e) => handleQuantityChange(item.product._id, parseInt(e.target.value))}
                  />
                </td>
                <td>₹{item.quantity * item.priceAtAddTime}</td>
                <td>
                  <button onClick={() => handleRemoveItem(item.product._id)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-total">
          <h2>Total: ₹{total}</h2>
          <button className="checkout-btn">Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
