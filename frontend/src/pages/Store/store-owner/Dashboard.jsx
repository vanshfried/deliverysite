import React,{ useEffect, useState } from "react";
import { storeOwnerMe } from "../api/storeOwner";

export default function StoreOwnerDashboard() {
  const [owner, setOwner] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await storeOwnerMe();
      if (res?.data) setOwner(res.data.owner);
    };

    fetchData();
  }, []);

  if (!owner) return <p>Loading...</p>;

  return (
    <div>
      <h2>Welcome, {owner.fullName}</h2>
      <p>Store: {owner.storeName}</p>
      <p>Phone: {owner.phone}</p>
    </div>
  );
}
