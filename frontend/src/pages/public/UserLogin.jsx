import React, { useState, useRef, useEffect } from "react";
import API from "../../api/api";
import "./css/UserLogin.css";

const UserLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  // Page-specific background
  useEffect(() => {
    document.body.classList.add("login-page-bg");
    return () => {
      document.body.classList.remove("login-page-bg");
    };
  }, []);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
  };

  const requestOtp = async () => {
    if (phone.length !== 10) {
      setMessage("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/users", { phone });
      setMessage(res.data.message || "OTP sent successfully!");
      setStep(2);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputsRef.current[0]?.focus(), 300);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setMessage("Please enter all 6 digits of the OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/users/verify-otp", { phone, otp: otpValue });
      setMessage(`Welcome ${res.data.user?.name || "User"}!`);
      setStep(1);
      setPhone("");
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-login">
      <h2>{step === 1 ? "Login with OTP" : "Enter OTP"}</h2>

      {message && <p className="inline-message">{message}</p>}

      {step === 1 ? (
        <>
          <div className="mobile-input-wrapper">
            <span className="prefix">+91</span>
            <input
              type="tel"
              placeholder="Enter mobile number"
              value={phone}
              onChange={handlePhoneChange}
              maxLength="10"
              disabled={loading}
            />
          </div>
          <button
            className="get-otp"
            onClick={requestOtp}
            disabled={loading}
          >
            {loading ? "Sending..." : "Get OTP"}
          </button>
        </>
      ) : (
        <>
          <p className="info-message">OTP sent to +91 {phone}</p>
          <div className="otp-container">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                ref={(el) => (inputsRef.current[idx] = el)}
                disabled={loading}
              />
            ))}
          </div>
          <button className="verify-otp" onClick={verifyOtp} disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <button
            className="resend-otp"
            onClick={requestOtp}
            disabled={loading}
          >
            Resend OTP
          </button>
        </>
      )}
    </div>
  );
};

export default UserLogin;
