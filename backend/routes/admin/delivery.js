// routes/admin/delivery.js
import express from "express";
import DeliveryBoy from "../../models/DeliveryBoy.js";
import { requireAdmin } from "../../middleware/auth.js"; // middleware to check admin role

const router = express.Router();

// POST /admin/delivery/register
router.post("/register", requireAdmin, async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone)
      return res.status(400).json({ error: "Name and phone required" });

    // check if already exists
    const existing = await DeliveryBoy.findOne({ phone });
    if (existing) return res.status(400).json({ error: "Delivery boy already exists" });

    const deliveryBoy = new DeliveryBoy({ name, phone });
    await deliveryBoy.save();

    res.json({ success: true, deliveryBoy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
