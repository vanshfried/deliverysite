import express from "express";
import { requireAdmin } from "../../../middleware/auth.js";
import StoreOwner from "../../../models/StoreOwner.js";
import Store from "../../../models/Store.js";

const router = express.Router();

// ---------------------------------------------------
// Get all store owner applications
// ---------------------------------------------------
router.get("/applications", requireAdmin, async (req, res) => {
  try {
    const applications = await StoreOwner.find({}).sort({ createdAt: -1 });

    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------------------------------
// Approve a store owner → also create Store
// ---------------------------------------------------
router.post("/approve/:id", requireAdmin, async (req, res) => {
  try {
    const owner = await StoreOwner.findById(req.params.id);
    if (!owner)
      return res.status(404).json({ message: "Store Owner not found" });

    owner.status = "approved";
    await owner.save();

    // Check if store already exists
    let store = await Store.findOne({ ownerId: owner._id });

    if (!store) {
      store = await Store.create({
        ownerId: owner._id,
        storeName: owner.storeName, // from signup
        phone: owner.phone, // useful to show store contact
        storeImage: "",
        address: "",
        description: "",
        openingTime: "",
        closingTime: "",
        isActive: true,
      });
    }

    return res.json({
      success: true,
      message: "Store Owner approved — Store created",
      store,
    });
  } catch (err) {
    console.error("Approval error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------------------------------
// Reject a store owner
// ---------------------------------------------------
router.post("/reject/:id", requireAdmin, async (req, res) => {
  try {
    await StoreOwner.findByIdAndUpdate(req.params.id, { status: "rejected" });
    res.json({ success: true, message: "Store Owner rejected" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
