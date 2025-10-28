// backend/routes/user/userRoutes.js
import express from "express";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import { requireUser } from "../../middleware/requireUser.js";

const router = express.Router();

// ✅ Generate OTP
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

    user.otp = otp;
    user.otpExpires = Date.now() + 3 * 60 * 1000; // 3 min expiry
    await user.save();

    console.log(`✅ OTP Generated for ${phone}: ${otp}`);

    return res.json({
      success: true,
      message: "OTP sent successfully",
      phone: user.phone,
    });
  } catch (err) {
    console.error("OTP ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Verify OTP and Login
router.post("/verify-otp", async (req, res) => {
  try {
    let { phone, otp } = req.body;

    if (!phone || !otp)
      return res.status(400).json({ error: "Phone and OTP required" });

    phone = "+91" + phone.replace(/\D/g, "").slice(0, 10);

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    console.log("Incoming Phone:", phone);
    console.log("Incoming OTP:", otp);

    console.log("DB Phone:", user.phone);
    console.log("DB OTP:", user.otp);
    console.log("DB OTP Expires:", user.otpExpires, "Now:", Date.now());

    console.log("OTP Match:", user.otp === otp);
    console.log("Is OTP expired:", user.otpExpires < Date.now());

    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      console.log("❌ Validation failed");
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // ✅ Invalidate OTP after success
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: true, // ✅ required for cross-site cookies
      sameSite: "none", // ✅ must match admin cookie settings
      path: "/", // ✅ allow cookie everywhere
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name || "User",
      },
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Logout
router.post("/logout", (req, res) => {
  res.clearCookie("userToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  return res.json({ success: true, message: "Logged out successfully" });
});

// ✅ Session Check
router.get("/me", requireUser, (req, res) => {
  const { _id, name, phone } = req.user;
  return res.json({ success: true, user: { _id, name, phone } });
});

export default router;
