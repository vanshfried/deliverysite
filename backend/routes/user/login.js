import express from "express";
import User from "../../models/User.js";

const router = express.Router();
const otpStore = {}; // in-memory OTP store (demo only)

/**
 * POST /users
 * Create a new user if not exists, or generate OTP for login
 */
router.post("/", async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) return res.status(400).json({ error: "Phone number is required" });

    // Keep only digits, limit 10
    phone = phone.replace(/\D/g, "").slice(0, 10);

    if (phone.length !== 10) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
    }

    phone = "+91" + phone; // prepend country code

    // Find existing user or create new one
    let user = await User.findOne({ phone });
    if (!user) {
      try {
        user = new User({ phone });
        await user.save();
      } catch (err) {
        // handle race condition duplicate
        if (err.code === 11000) {
          user = await User.findOne({ phone });
        } else {
          throw err;
        }
      }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = otp;

    console.log(`OTP for ${phone}: ${otp}`); // log OTP for demo

    res.status(200).json({ message: "OTP sent. Check console.", phone: user.phone });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /verify-otp
 * Verify OTP for login
 */
router.post("/verify-otp", async (req, res) => {
  try {
    let { phone, otp } = req.body;

    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP are required" });

    phone = "+91" + phone.replace(/\D/g, "").slice(0, 10);

    const storedOtp = otpStore[phone];
    if (!storedOtp) return res.status(400).json({ error: "No OTP found" });
    if (storedOtp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    delete otpStore[phone]; // OTP consumed

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, phone: user.phone, name: user.name || "User" },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
