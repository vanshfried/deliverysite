// StoreOwnerLayout.jsx
import React from "react";
import StoreOwnerHeader from "./StoreOwnerHeader";
import styles from "../css/StoreOwnerLayout.module.css";

export default function StoreOwnerLayout({ children }) {
  return (
    <div className={styles.layoutContainer}>
      <StoreOwnerHeader />
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
