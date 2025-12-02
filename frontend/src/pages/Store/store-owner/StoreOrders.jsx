import React,{ useEffect, useState } from "react";
import API from "../../../api/api"; // your existing API instance

const StoreOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch store-owner orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get("/store-owner/orders/list");
      setOrders(res.data.orders);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Accept Order
  const handleAccept = async (orderId) => {
    try {
      await API.patch(`/store-owner/orders/accept/${orderId}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  // Reject Order
  const handleReject = async (orderId) => {
    try {
      await API.patch(`/store-owner/orders/reject/${orderId}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div>Loading orders...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Store Orders</h2>

      {orders.length === 0 && <p>No orders found.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {orders.map((order) => (
          <div
            key={order._id}
            style={{
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              background: "#fafafa",
            }}
          >
            <h3>Order #{order.slug}</h3>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Total:</strong> ₹{order.totalAmount}
            </p>
            <p>
              <strong>Customer:</strong> {order.user?.name}
            </p>

            <h4>Items:</h4>
            <ul>
              {order.items.map((item, idx) => (
                <li key={idx}>
                  {item.name} × {item.quantity} — ₹{item.price}
                </li>
              ))}
            </ul>

            {/* SHOW ACTION BUTTONS ONLY FOR PENDING ORDERS */}
            {order.status === "PENDING" && (
              <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleAccept(order._id)}
                  style={{
                    padding: "8px 14px",
                    background: "green",
                    color: "white",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Accept
                </button>

                <button
                  onClick={() => handleReject(order._id)}
                  style={{
                    padding: "8px 14px",
                    background: "red",
                    color: "white",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreOrders;
