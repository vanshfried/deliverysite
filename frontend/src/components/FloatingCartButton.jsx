import React,{ useContext } from "react";
import { CartContext } from "../pages/admin/Context/CartContext";
import { useNavigate } from "react-router-dom";
import styles from "./css/FloatingCartButton.module.css";

export default function FloatingCartButton() {
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();

  if (!cart || cart.totalItems === 0) return null;

  return (
    <div
      className={styles.floatingCartBar}
      onClick={() => navigate("/cart")}
    >
      🛒 Go to Cart • {cart.totalItems} items
    </div>
  );
}
