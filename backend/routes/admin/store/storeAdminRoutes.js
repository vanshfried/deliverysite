import express from "express";
import {requireAdmin} from "../../../middleware/auth.js"; // your admin auth middleware
import StoreOwner from "../../../models/StoreOwner.js";

const router = express.Router();

// ✅ Get all store owner applications
router.get("/applications", requireAdmin, async (req, res) => {
  try {
    const applications = await StoreOwner.find({})
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Approve a store owner
router.post("/approve/:id", requireAdmin, async (req, res) => {
  try {
    await StoreOwner.findByIdAndUpdate(req.params.id, { status: "approved" });

    res.json({ success: true, message: "Store Owner approved" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ❌ Reject a store owner
router.post("/reject/:id", requireAdmin, async (req, res) => {
  try {
    await StoreOwner.findByIdAndUpdate(req.params.id, { status: "rejected" });

    res.json({ success: true, message: "Store Owner rejected" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
