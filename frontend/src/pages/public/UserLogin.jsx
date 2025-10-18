import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { AuthContext } from "../admin/Context/AuthContext.jsx";
import styles from './css/UserLogin.module.css';

const UserLogin = () => {
  const { setUserLoggedIn, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const inputsRef = useRef([]);

  const handlePhoneChange = (e) => {
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
  };

  const requestOtp = async () => {
    if (phone.length !== 10) {
      setMessage("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/users/otp", { phone });
      setMessage(res.data.message);
      setStep(2);
      setOtp(Array(6).fill(""));
      setOtpSent(true);
      setTimeout(() => inputsRef.current[0]?.focus(), 200);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setMessage("Enter all 6 digits");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/users/verify-otp", { phone, otp: otpValue });
      setMessage(`Welcome ${res.data.user.name || "User"}!`);

      setUserLoggedIn(true);
      setUser(res.data.user);
      navigate("/");

      setStep(1);
      setPhone("");
      setOtp(Array(6).fill(""));
      setOtpSent(false);
    } catch (err) {
      setMessage(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!phone) return setMessage("Enter phone first");
    requestOtp();
  };

  return (
    <div className={styles.loginPageBg}>
      <div className={styles.userLogin}>
        <h2>{step === 1 ? "Login with OTP" : "Enter OTP"}</h2>
        {message && <p className={styles.inlineMessage}>{message}</p>}

        {step === 1 ? (
          <>
            <div className={styles.mobileInputWrapper}>
              <span className={styles.prefix}>+91</span>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={10}
                disabled={loading}
                className={styles.mobileInput}
              />
            </div>
            <button
              onClick={requestOtp}
              disabled={loading}
              className={`${styles.getOtpButton} ${styles.buttonCommon}`}
            >
              {loading ? "Sending..." : "Get OTP"}
            </button>
          </>
        ) : (
          <>
            <p>OTP sent to +91 {phone}</p>
            <div className={styles.otpContainer}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  ref={(el) => (inputsRef.current[i] = el)}
                  disabled={loading}
                  className={styles.otpInput}
                />
              ))}
            </div>
            <button
              onClick={verifyOtp}
              disabled={loading}
              className={`${styles.verifyOtpButton} ${styles.buttonCommon}`}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={handleResend}
              disabled={loading || !otpSent}
              className={styles.resendOtpButton}
            >
              Resend OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserLogin;
