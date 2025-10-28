import React, { createContext, useState, useEffect, useContext } from "react";
import API from "../../../api/api";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { userLoggedIn } = useContext(AuthContext);

  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [addedCount, setAddedCount] = useState(0);

  const hasUserCookie = () => document.cookie.includes("userToken=");

  const fetchCart = async () => {
    if (!userLoggedIn && !hasUserCookie()) {
      setCart({ items: [] });
      setLoading(false);
      return;
    }

    try {
      const res = await API.get("/api/cart");
      setCart(res.data.cart);
    } catch (err) {
      if (err.response?.status !== 401) console.error(err);
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch cart when login state changes
  useEffect(() => {
    fetchCart();
  }, [userLoggedIn]);

  // ✅ Clear cart visually on logout
  useEffect(() => {
    if (!userLoggedIn) setCart({ items: [] });
  }, [userLoggedIn]);

  const addToCart = async (productId, quantity = 1) => {
    if (!userLoggedIn) return cart;
    const res = await API.post("/api/cart/add", { productId, quantity });

    const exists = cart.items.find(i => i.product._id === productId);
    if (!exists) setAddedCount(prev => prev + 1);

    setCart(res.data.cart);
    return res.data.cart;
  };

  const updateItem = async (productId, quantity) => {
    if (!userLoggedIn) return cart;
    const res = await API.put("/api/cart/update", { productId, quantity });
    setCart(res.data.cart);
    return res.data.cart;
  };

  const removeItem = async (productId) => {
    if (!userLoggedIn) return cart;
    const res = await API.delete("/api/cart/remove", { data: { productId } });
    setCart(res.data.cart);
    return res.data.cart;
  };

  const clearCart = async () => {
    if (!userLoggedIn) return cart;
    const res = await API.delete("/api/cart/clear");
    setCart(res.data.cart);
    setAddedCount(0);
    return res.data.cart;
  };

  return (
    <CartContext.Provider value={{ cart, loading, addedCount, addToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
