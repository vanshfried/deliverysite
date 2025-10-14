// backend/routes/user/usersRouter.js
import express from "express";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import { requireUser } from "../../middleware/requireUser.js";

const router = express.Router();
const otpStore = {}; // in-memory OTP store (demo only)

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
    console.log(`OTP for ${phone}: ${otp}`);

    res.status(200).json({ message: "OTP sent. Check console.", phone: user.phone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Verify OTP & login ---
router.post("/verify-otp", async (req, res) => {
  try {
    let { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP required" });

    phone = "+91" + phone.replace(/\D/g, "").slice(0, 10);

    const storedOtp = otpStore[phone];
    if (!storedOtp) return res.status(400).json({ error: "No OTP found" });
    if (storedOtp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    delete otpStore[phone]; // OTP consumed

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Issue JWT cookie
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res
      .cookie("userToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: "Login successful",
        user: { id: user._id, phone: user.phone, name: user.name || "User" },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Logout ---
router.post("/logout", (req, res) => {
  res
    .clearCookie("userToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
    .status(200)
    .json({ message: "Logged out successfully" });
});

// --- Get current logged-in user ---
router.get("/me", requireUser, async (req, res) => {
  const { _id, name, phone, addresses } = req.user;
  res.status(200).json({
    success: true,
    user: { _id, name, phone, addresses },
  });
});

export default router;
