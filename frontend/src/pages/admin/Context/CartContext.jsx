import React, { createContext, useState, useEffect, useContext } from "react";
import API from "../../../api/api";
import { AuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { userLoggedIn } = useContext(AuthContext);

  const [cart, setCart] = useState({ items: [], totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [addedCount, setAddedCount] = useState(0);

  const hasUserCookie = () => document.cookie.includes("userToken=");

  // 👉 Helper to calculate total items
  const getTotalItems = (items) =>
    items.reduce((sum, i) => sum + i.quantity, 0);

  const applyCart = (serverCart) => {
    setCart({
      ...serverCart,
      totalItems: getTotalItems(serverCart.items || []),
    });
  };

  const fetchCart = async () => {
    if (!userLoggedIn && !hasUserCookie()) {
      setCart({ items: [], totalItems: 0 });
      setLoading(false);
      return;
    }

    try {
      const res = await API.get("/api/cart");
      applyCart(res.data.cart);
    } catch (err) {
      if (err.response?.status !== 401) console.error(err);
      setCart({ items: [], totalItems: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userLoggedIn]);

  useEffect(() => {
    if (!userLoggedIn) setCart({ items: [], totalItems: 0 });
  }, [userLoggedIn]);

  // -----------------------------
  // 🚨 UPDATED ADD TO CART
  // -----------------------------
  const addToCart = async (productId, quantity = 1) => {
    if (!userLoggedIn) return cart;

    try {
      const res = await API.post("/api/cart/add", { productId, quantity });

      if (res.data.conflict) {
        return {
          conflict: true,
          storeName: res.data.storeName,
        };
      }

      const exists = cart.items.find((i) => i.product._id === productId);
      if (!exists) setAddedCount((prev) => prev + 1);

      applyCart(res.data.cart);
      return res.data.cart;
    } catch (err) {
      console.error(err);
      return cart;
    }
  };

  const updateItem = async (productId, quantity) => {
    if (!userLoggedIn) return cart;
    const res = await API.put("/api/cart/update", { productId, quantity });
    applyCart(res.data.cart);
    return res.data.cart;
  };

  const removeItem = async (productId) => {
    if (!userLoggedIn) return cart;
    const res = await API.delete("/api/cart/remove", { data: { productId } });
    applyCart(res.data.cart);
    return res.data.cart;
  };

  const clearCart = async () => {
    if (!userLoggedIn) return cart;
    const res = await API.delete("/api/cart/clear");
    applyCart(res.data.cart);
    setAddedCount(0);
    return res.data.cart;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addedCount,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
