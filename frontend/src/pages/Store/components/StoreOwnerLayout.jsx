// StoreOwnerLayout.jsx
import React from "react";
import StoreOwnerHeader from "./StoreOwnerHeader";

export default function StoreOwnerLayout({ children }) {
  return (
    <div>
      <StoreOwnerHeader />
      <main>{children}</main>
    </div>
  );
}
