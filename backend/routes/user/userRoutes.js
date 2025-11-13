// backend/routes/user/userRoutes.js
import express from "express";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import { requireUser } from "../../middleware/requireUser.js";
import Cart from "../../models/Cart.js";
import twilio from "twilio";
const router = express.Router();
import dotenv from 'dotenv';
dotenv.config();
// ✅ Generate OTP
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ======================================================
   ✅ Send OTP via Twilio Verify
====================================================== */
router.post("/otp", async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone required" });

    phone = "+91" + phone.replace(/\D/g, "").slice(0, 10);

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verifications.create({ to: phone, channel: "sms" });

    console.log(`✅ OTP sent via Twilio to ${phone}:`, verification.status);
    return res.json({ success: true, message: "OTP sent successfully", phone });
  } catch (err) {
    console.error("❌ OTP SEND ERROR:", err.message);
    if (err.code) console.error("Twilio Error Code:", err.code);
    res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
});


/* ======================================================
   ✅ Verify OTP via Twilio Verify
====================================================== */
router.post("/verify-otp", async (req, res) => {
  try {
    let { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ error: "Phone & OTP required" });

    phone = "+91" + phone.replace(/\D/g, "").slice(0, 10);

    // ✅ Verify code with Twilio
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: phone, code: otp });

    if (verificationCheck.status !== "approved") {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // ✅ Find or create user
    let user = await User.findOne({ phone });
    if (!user) user = await User.create({ phone });

    // ✅ Create token and login
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("userToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login success",
      user: { id: user._id, phone: user.phone, name: user.name || "User" },
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ error: "OTP verification failed" });
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
  return res.json({ success: true, message: "Logged out" });
});

// ✅ Session check
router.get("/me", requireUser, async (req, res) => {
  const { _id, name, phone, addresses, defaultAddress } = req.user;
  return res.json({
    success: true,
    user: { _id, name, phone, addresses, defaultAddress },
  });
});

// ✅ Update profile
router.put("/update", requireUser, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: req.body.name },
      { new: true }
    );
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Add Address
router.post("/address", requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.addresses.length >= 3) {
      return res.status(400).json({ error: "Max 3 addresses allowed" });
    }

    const { houseNo, laneOrSector, pincode, landmark } = req.body;
    if (!houseNo || !laneOrSector)
      return res.status(400).json({ error: "Required fields missing" });
    if (!/^\d{6}$/.test(String(pincode)))
      return res.status(400).json({ error: "Invalid pincode" });

    const newAddr = {
      label: req.body.label ?? "",
      houseNo,
      laneOrSector,
      landmark: landmark ?? "",
      pincode,
      coords: req.body.coords ?? { lat: 0, lon: 0 },
    };

    user.addresses.push(newAddr);
    await user.save();

    // ✅ If first address → auto default
    if (!user.defaultAddress && user.addresses.length === 1) {
      user.defaultAddress = user.addresses[0]._id;
      await user.save();
    }

    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error("ADD ADDRESS ERROR:", err);
    res.status(500).json({ error: "Address add failed" });
  }
});

// ✅ Edit Address
// ✅ Edit Address (fixed to handle coords)
router.put("/address/:id", requireUser, async (req, res) => {
  try {
    const allowed = ["label", "houseNo", "laneOrSector", "landmark", "pincode"];
    const updates = {};

    // Update regular fields
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates[`addresses.$.${f}`] = String(req.body[f]);
      }
    });

    // ✅ Update coordinates if provided
    if (
      req.body.coords !== undefined &&
      req.body.coords.lat !== undefined &&
      req.body.coords.lon !== undefined
    ) {
      updates[`addresses.$.coords`] = {
        lat: Number(req.body.coords.lat),
        lon: Number(req.body.coords.lon),
      };
    }

    const updated = await User.findOneAndUpdate(
      { _id: req.user._id, "addresses._id": req.params.id },
      { $set: updates },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Address not found" });

    res.json({ success: true, addresses: updated.addresses });
  } catch (err) {
    console.error("ADDRESS UPDATE ERROR:", err);
    res.status(500).json({ error: "Address update failed" });
  }
});

// ✅ Delete Address
router.delete("/address/:id", requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const addrId = req.params.id;

    user.addresses = user.addresses.filter((a) => a._id.toString() !== addrId);

    // ✅ If default got deleted → reset
    if (user.defaultAddress?.toString() === addrId) {
      user.defaultAddress =
        user.addresses.length > 0 ? user.addresses[0]._id : null;
    }

    await user.save();

    res.json({
      success: true,
      addresses: user.addresses,
      defaultAddress: user.defaultAddress,
    });
  } catch {
    res.status(500).json({ error: "Address remove failed" });
  }
});

// ✅ Set Default Address
router.put("/address/default/:id", requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);

    if (!address) return res.status(404).json({ error: "Address not found" });

    user.defaultAddress = req.params.id;
    await user.save();

    res.json({
      success: true,
      message: "Default address updated",
      defaultAddress: user.defaultAddress,
      addresses: user.addresses,
    });
  } catch {
    res.status(500).json({ error: "Set default failed" });
  }
});

// ✅ Delete Account
router.delete("/delete", requireUser, async (req, res) => {
  try {
    const userId = req.user._id;
    await Cart.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.clearCookie("userToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    res.json({ success: true, message: "Account deleted fully" });
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
