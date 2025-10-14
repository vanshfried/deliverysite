import React, { createContext, useState, useEffect } from "react";
import API from "../../../api/api";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [addedCount, setAddedCount] = useState(0); // ✅ track new unique items

  const fetchCart = async () => {
    try {
      const res = await API.get("/api/cart", { withCredentials: true });
      setCart(res.data.cart);
    } catch (err) {
      console.error(err);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (productId, quantity = 1) => {
    const res = await API.post(
      "/api/cart/add",
      { productId, quantity },
      { withCredentials: true }
    );

    // ✅ increment addedCount only if new product
    const existingItem = cart.items.find(item => item.product._id === productId);
    if (!existingItem) setAddedCount(prev => prev + 1);

    setCart(res.data.cart);
    return res.data.cart;
  };

  const updateItem = async (productId, quantity) => {
    const res = await API.put(
      "/api/cart/update",
      { productId, quantity },
      { withCredentials: true }
    );
    setCart(res.data.cart);
    return res.data.cart;
  };

  const removeItem = async (productId) => {
    const res = await API.delete("/api/cart/remove", {
      data: { productId },
      withCredentials: true,
    });
    setCart(res.data.cart);
    return res.data.cart;
  };

  const clearCart = async () => {
    const res = await API.delete("/api/cart/clear", { withCredentials: true });
    setCart(res.data.cart);
    setAddedCount(0); // reset addedCount
    return res.data.cart;
  };

  return (
    <CartContext.Provider
      value={{ cart, loading, addedCount, addToCart, updateItem, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};
