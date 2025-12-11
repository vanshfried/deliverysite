import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import StoreOwnerLayout from "../components/StoreOwnerLayout";

const VerifyPickUp = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState(null);

  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  // Fetch order details
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/store-owner/orders/list`);

      if (res?.data?.orders) {
        const foundOrder = res.data.orders.find((o) => o._id === orderId);
        setOrder(foundOrder || null);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const handleOtpChange = (value, index) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/, "");
    setOtp(newOtp);

    // Move to next box
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleVerifyPickup = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 4) {
      setMessage("Please enter a valid 4-digit OTP.");
      return;
    }

    try {
      setVerifying(true);
      const res = await API.patch(
        `/store-owner/orders/verify-pickup/${orderId}`,
        { otp: otpCode }
      );

      if (res && res.data) {
        setMessage("Pickup verified successfully!");
        setTimeout(() => navigate("/store-owner/orders"), 1200);
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
        "Verification failed. Please check the OTP."
      );
    }

    setVerifying(false);
  };

  // ------------------------------
  // STYLES — kept inside JSX file
  // ------------------------------

  const container = {
    padding: "30px",
    maxWidth: "600px",
    margin: "0 auto",
  };

  const card = {
    background: "#fff",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  };

  const title = {
    textAlign: "center",
    fontSize: "1.7rem",
    fontWeight: "600",
    marginBottom: "20px",
  };

  const otpBoxContainer = {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    gap: "12px",
  };

  const otpInput = {
    width: "55px",
    height: "55px",
    fontSize: "1.8rem",
    textAlign: "center",
    borderRadius: "10px",
    border: "2px solid #ccc",
    outline: "none",
    transition: "0.2s",
  };

  const otpInputFocus = {
    borderColor: "#4CAF50",
  };

  const buttonContainer = {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "25px",
  };

  const btn = {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "0.2s",
  };

  const verifyBtn = {
    ...btn,
    background: "#4CAF50",
    color: "white",
  };

  const cancelBtn = {
    ...btn,
    background: "#ff4d4d",
    color: "white",
  };

  if (loading)
    return (
      <StoreOwnerLayout>
        <div style={container}>Loading order...</div>
      </StoreOwnerLayout>
    );

  if (!order)
    return (
      <StoreOwnerLayout>
        <div style={container}>Order not found.</div>
      </StoreOwnerLayout>
    );

  return (
    <StoreOwnerLayout>
      <div style={container}>
        <h2 style={title}>Verify Pickup</h2>

        <div style={card}>
          <h3>Order #{order.slug}</h3>
          <p><strong>Total:</strong> ₹{order.totalAmount}</p>
          <p><strong>Customer:</strong> {order.user?.name}</p>

          <h4 style={{ marginTop: "15px" }}>Items:</h4>
          <ul>
            {order.items.map((item, i) => (
              <li key={i}>
                {item.name} × {item.quantity} — ₹{item.price}
              </li>
            ))}
          </ul>

          {/* OTP UI */}
          <div style={otpBoxContainer}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                value={digit}
                style={{
                  ...otpInput,
                  ...(digit ? otpInputFocus : {}),
                }}
                maxLength="1"
                onChange={(e) => handleOtpChange(e.target.value, i)}
              />
            ))}
          </div>

          {message && (
            <p style={{ textAlign: "center", marginTop: "15px", color: "red" }}>
              {message}
            </p>
          )}

          <div style={buttonContainer}>
            <button
              style={verifyBtn}
              onClick={handleVerifyPickup}
              disabled={verifying}
            >
              {verifying ? "Verifying..." : "Verify Pickup"}
            </button>

            <button
              style={cancelBtn}
              onClick={() => navigate("/store-owner/orders")}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </StoreOwnerLayout>
  );
};

export default VerifyPickUp;
