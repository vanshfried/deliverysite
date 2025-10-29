// backend/routes/user/userRoutes.js
import express from "express";
import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import { requireUser } from "../../middleware/requireUser.js";
import Cart from "../../models/Cart.js";

const router = express.Router();

// ✅ Generate OTP
router.post("/otp", async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone required" });

    phone = "+91" + phone.replace(/\D/g, "").slice(0, 10);

    let user = await User.findOne({ phone });
    if (!user) user = await User.create({ phone });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 3 * 60 * 1000;
    await user.save();

    console.log(`✅ OTP Generated for ${phone}: ${otp}`);

    return res.json({ success: true, message: "OTP sent", phone });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Verify OTP & Login
router.post("/verify-otp", async (req, res) => {
  try {
    let { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone & OTP required" });

    phone = "+91" + phone.replace(/\D/g, "").slice(0, 10);
    const user = await User.findOne({ phone });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

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
      user: { id: user._id, phone: user.phone, name: user.name || "User" }
    });
  } catch {
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
  return res.json({ success: true, message: "Logged out" });
});

// ✅ Session check
router.get("/me", requireUser, async (req, res) => {
  const { _id, name, phone, addresses } = req.user;
  return res.json({ success: true, user: { _id, name, phone, addresses } });
});

// ✅ Update profile
router.put("/update", requireUser, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name: req.body.name }, { new: true });
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
    if (!houseNo || !laneOrSector) return res.status(400).json({ error: "Required fields missing" });
    if (!/^\d{6}$/.test(String(pincode))) return res.status(400).json({ error: "Invalid pincode" });

    user.addresses.push({
      label: req.body.label ?? "",
      houseNo,
      laneOrSector,
      landmark: landmark ?? "",
      pincode,
      coords: req.body.coords ?? { lat: 0, lon: 0 },
    });

    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    console.error("ADD ADDRESS ERROR:", err);
    res.status(500).json({ error: "Address add failed" });
  }
});

// ✅ Edit Address (Secure)
router.put("/address/:id", requireUser, async (req, res) => {
  try {
    const allowed = ["label", "houseNo", "laneOrSector", "landmark", "pincode"];
    const updates = {};

    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        updates[`addresses.$.${f}`] = String(req.body[f]);
      }
    });

    const updated = await User.findOneAndUpdate(
      { _id: req.user._id, "addresses._id": req.params.id },
      { $set: updates },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Address not found" });

    res.json({ success: true, addresses: updated.addresses });
  } catch {
    res.status(500).json({ error: "Address update failed" });
  }
});

// ✅ Delete Address
router.delete("/address/:id", requireUser, async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { addresses: { _id: req.params.id } } },
      { new: true }
    );
    res.json({ success: true, addresses: updated.addresses });
  } catch {
    res.status(500).json({ error: "Address remove failed" });
  }
});

// ✅ Delete Account Entirely
router.delete("/delete", requireUser, async (req, res) => {
  try {
    const userId = req.user._id;

    await Cart.deleteMany({ user: userId }); // ✅ Bulletproof
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
