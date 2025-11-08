//backend\routes\delivery\authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import DeliveryBoy from "../../models/DeliveryBoy.js";
import { requireDeliveryBoy } from "../../middleware/requireDeliveryBoy.js";
const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 🧾 SIGNUP — Register New Delivery Partner                                  */
/* -------------------------------------------------------------------------- */
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, error: "All fields required" });
    }

    const existing = await DeliveryBoy.findOne({ phone });

    if (existing) {
      // ❌ Block if previously rejected
      if (existing.status === "rejected") {
        return res.status(403).json({
          success: false,
          error:
            "Your previous application was rejected. You cannot reapply.",
        });
      }
      return res.status(400).json({ success: false, error: "Phone already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const deliveryBoy = await DeliveryBoy.create({
      name,
      phone,
      passwordHash,
      isApproved: false, // admin will approve later
      status: "pending", // optional field to track approval
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Please wait for admin approval.",
      deliveryBoy: { id: deliveryBoy._id, name, phone },
    });
  } catch (err) {
    console.error("❌ DELIVERY SIGNUP ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Failed to register delivery partner",
    });
  }
});


/* -------------------------------------------------------------------------- */
/* 🔐 LOGIN — Delivery Partner Login                                          */
/* -------------------------------------------------------------------------- */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, error: "Phone and password required" });
    }

    const deliveryBoy = await DeliveryBoy.findOne({ phone });
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, error: "No account found with this number" });
    }

    const match = await bcrypt.compare(password, deliveryBoy.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, error: "Incorrect password" });
    }

    if (!deliveryBoy.isApproved) {
      return res.status(403).json({
        success: false,
        error: "Your account is awaiting admin approval",
      });
    }

    if (!deliveryBoy.isActive) {
      return res.status(403).json({
        success: false,
        error: "Your account has been deactivated by admin",
      });
    }

    // ✅ Generate JWT & store in secure cookie
    const token = jwt.sign({ id: deliveryBoy._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("deliveryToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: "Login successful",
      deliveryBoy: {
        id: deliveryBoy._id,
        name: deliveryBoy.name,
        phone: deliveryBoy.phone,
      },
    });
  } catch (err) {
    console.error("❌ DELIVERY LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 🚪 LOGOUT — Clear Cookie Session                                           */
/* -------------------------------------------------------------------------- */
router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("deliveryToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("❌ DELIVERY LOGOUT ERROR:", err);
    res.status(500).json({ success: false, error: "Failed to log out" });
  }
});

/* -------------------------------------------------------------------------- */
/* 👤 GET /api/delivery/me — Get Logged-In Delivery Partner Info              */
/* -------------------------------------------------------------------------- */
router.get("/me", requireDeliveryBoy, async (req, res) => {
  try {
    const deliveryBoy = req.user;
    res.json({
      success: true,
      deliveryBoy: {
        id: deliveryBoy._id,
        name: deliveryBoy.name,
        phone: deliveryBoy.phone,
        isApproved: deliveryBoy.isApproved,
        isActive: deliveryBoy.isActive,
        stats: deliveryBoy.stats,
        currentOrder: deliveryBoy.currentOrder,
      },
    });
  } catch (err) {
    console.error("❌ DELIVERY ME ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
    });
  }
});

// PATCH /api/delivery/status
router.patch("/status", requireDeliveryBoy, async (req, res) => {
  try {
    const { isActive } = req.body; // expect boolean
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, error: "isActive must be boolean" });
    }

    const updated = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      { isActive },
      { new: true }
    );

    res.json({
      success: true,
      message: `Your status is now ${isActive ? "Active" : "Inactive"}`,
      deliveryBoy: {
        id: updated._id,
        name: updated.name,
        phone: updated.phone,
        isActive: updated.isActive,
      },
    });
  } catch (err) {
    console.error("❌ UPDATE STATUS ERROR:", err);
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
});

export default router;
