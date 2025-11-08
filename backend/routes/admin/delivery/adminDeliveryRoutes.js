// backend\routes\admin\delivery\adminDeliveryRoutes.js
import express from "express";
import DeliveryPartner from "../../../models/DeliveryBoy.js";
import { requireAdmin } from "../../../middleware/auth.js";

const router = express.Router();

// ✅ Get all applicants (admin only)
router.get("/applicants", requireAdmin, async (req, res) => {
  try {
    const applicants = await DeliveryPartner.find().sort({ createdAt: -1 });
    res.json({ success: true, applicants });
  } catch (err) {
    console.error("❌ Error fetching applicants:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ✅ Approve applicant
router.post("/approve/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      { status: "approved", isApproved: true },
      { new: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, error: "Applicant not found" });

    res.json({ success: true, message: "Applicant approved", updated });
  } catch (err) {
    console.error("❌ Error approving applicant:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to approve applicant" });
  }
});

// ✅ Reject applicant (keep in DB, bar from reapplying)
router.post("/reject/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await DeliveryPartner.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", isApproved: false, isActive: false },
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to reject" });
  }
});
// GET all delivery agents
// GET all approved delivery agents
router.get("/all", requireAdmin, async (req, res) => {
  try {
    const deliveryAgents = await DeliveryPartner.find({ status: "approved" }) // only approved
      .sort({ createdAt: -1 })
      .select("name phone status isActive stats serviceArea address");
    res.json({ success: true, deliveryAgents });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch delivery agents" });
  }
});

export default router;
