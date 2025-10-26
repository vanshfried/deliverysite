import React, { createContext, useState, useEffect, useContext } from "react";
import API from "../../../api/api";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { userLoggedIn } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [addedCount, setAddedCount] = useState(0);

  const fetchCart = async () => {
    // Skip fetching if user is not logged in AND no session cookie exists
    if (!userLoggedIn && !document.cookie.includes("session")) {
      setCart({ items: [] });
      setLoading(false);
      return;
    }

    try {
      const res = await API.get("/api/cart", { withCredentials: true });
      setCart(res.data.cart);
    } catch (err) {
      // Only log unexpected errors
      if (err.response?.status !== 401) console.error(err);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userLoggedIn]);

  // Clear cart if user logs out
  useEffect(() => {
    if (!userLoggedIn) setCart({ items: [] });
  }, [userLoggedIn]);

  const addToCart = async (productId, quantity = 1) => {
    if (!userLoggedIn) return cart;
    const res = await API.post("/api/cart/add", { productId, quantity }, { withCredentials: true });

    const existingItem = cart.items.find(item => item.product._id === productId);
    if (!existingItem) setAddedCount(prev => prev + 1);

    setCart(res.data.cart);
    return res.data.cart;
  };

  const updateItem = async (productId, quantity) => {
    if (!userLoggedIn) return cart;
    const res = await API.put("/api/cart/update", { productId, quantity }, { withCredentials: true });
    setCart(res.data.cart);
    return res.data.cart;
  };

  const removeItem = async (productId) => {
    if (!userLoggedIn) return cart;
    const res = await API.delete("/api/cart/remove", { data: { productId }, withCredentials: true });
    setCart(res.data.cart);
    return res.data.cart;
  };

  const clearCart = async () => {
    if (!userLoggedIn) return cart;
    const res = await API.delete("/api/cart/clear", { withCredentials: true });
    setCart(res.data.cart);
    setAddedCount(0);
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
