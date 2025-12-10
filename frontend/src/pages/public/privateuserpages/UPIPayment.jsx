import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./css/UPIPayment.module.css";

export default function UPIPayment() {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state) return <h2>Invalid Payment Request</h2>;

  const { amount } = state;

  const upiID = "9149501021@pytes";
  const upiLink = `upi://pay?pa=${upiID}&pn=Store&cu=INR&am=${amount}`;

  return (
    <div className={styles.upiPageWrapper}>
      <div className={styles.upiCard}>
        <h1 className={styles.upiTitle}>Secure UPI Payment</h1>
        <p className={styles.upiSubtitle}>
          Scan the QR or tap the button to pay instantly
        </p>

        <a href={upiLink} className={styles.payButton}>
          Pay ₹{amount} via UPI
        </a>

        {/* QR Box */}
        <div className={styles.qrBox}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
              upiLink
            )}`}
            alt="UPI QR Code"
            className={styles.qrImage}
          />
          <p className={styles.upiIdText}>UPI ID: {upiID}</p>
        </div>

        {/* Info */}
        <div className={styles.infoBox}>
          <h3>After Payment</h3>
          <ul>
            <li>Take a screenshot of your payment</li>
            <li>Send it on WhatsApp for verification</li>
            <li>Your order will be confirmed manually</li>
          </ul>

          <p className={styles.warning}>
            ⚠ Your order will NOT be placed until payment is verified.
          </p>
        </div>

        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Go Back & Choose COD
        </button>
      </div>
    </div>
  );
}
