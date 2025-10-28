// backend/routes/user/userRoutes.js
import express from "express";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import { requireUser } from "../../middleware/requireUser.js";

const router = express.Router();
const otpStore = {}; // temporary OTP store

// --- Generate OTP ---
router.post("/otp", async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone required" });

    phone = "+91" + phone.replace(/\D/g, "").slice(0, 10);

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone });
      await user.save();
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = otp;
    console.log(`✅ OTP for ${phone}: ${otp}`);

    res.status(200).json({ message: "OTP sent successfully", phone: user.phone });
  } catch (err) {
    console.error("OTP ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Verify OTP & Login ---
router.post("/verify-otp", async (req, res) => {
  try {
    let { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP required" });

    phone = "+91" + phone.replace(/\D/g, "").slice(0, 10);

    const storedOtp = otpStore[phone];
    if (!storedOtp) return res.status(400).json({ error: "No OTP found" });
    if (storedOtp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    delete otpStore[phone]; // remove OTP

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: false, // ✅ local dev must be false
      sameSite: "Lax", // ✅ FIX HERE
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name || "User",
      },
    });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Logout ---
router.post("/logout", (req, res) => {
  res.clearCookie("userToken", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });
  res.json({ message: "Logged out successfully" });
});

// --- Session Check ---
router.get("/me", requireUser, (req, res) => {
  const { _id, name, phone } = req.user;
  res.json({ success: true, user: { _id, name, phone } });
});

export default router;
