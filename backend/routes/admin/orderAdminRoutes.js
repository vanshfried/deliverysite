// backend/routes/admin/orderAdminRoutes.js
import express from "express";
import Order from "../../models/Order.js";
import { requireAdmin } from "../../middleware/auth.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 📋 GET: All Active (Recent) Orders for Admin                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* 📋 GET: All Pending Orders for Admin                                       */
/* -------------------------------------------------------------------------- */
router.get("/pending", requireAdmin, async (req, res) => {
  try {
    // ✅ Only show orders with status "PENDING"
    const pendingOrders = await Order.find({ status: "PENDING" })
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: pendingOrders.length,
      orders: pendingOrders,
    });
  } catch (err) {
    console.error("❌ FETCH PENDING ORDERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending orders",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 🚚 GET: All Active (Processing / Out for Delivery) Orders for Admin        */
/* -------------------------------------------------------------------------- */
router.get("/active", requireAdmin, async (req, res) => {
  try {
    const activeOrders = await Order.find({
      status: { $in: ["PROCESSING", "OUT_FOR_DELIVERY"] },
    })
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: activeOrders.length,
      orders: activeOrders,
    });
  } catch (err) {
    console.error("❌ FETCH ACTIVE ORDERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active orders",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 🔢 GET: Count of Pending Orders                                            */
/* -------------------------------------------------------------------------- */
router.get("/count/pending", requireAdmin, async (req, res) => {
  try {
    const count = await Order.countDocuments({ status: "PENDING" });
    res.json({ success: true, count });
  } catch (err) {
    console.error("❌ FETCH PENDING COUNT ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch count" });
  }
});

/* -------------------------------------------------------------------------- */
/* 🔢 GET: Count of Active Orders (Processing / Out for Delivery)             */
/* -------------------------------------------------------------------------- */
router.get("/count/active", requireAdmin, async (req, res) => {
  try {
    const count = await Order.countDocuments({
      status: { $in: ["PROCESSING", "OUT_FOR_DELIVERY"] },
    });
    res.json({ success: true, count });
  } catch (err) {
    console.error("❌ FETCH ACTIVE COUNT ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch count" });
  }
});

/* -------------------------------------------------------------------------- */
/* 📦 GET: Single order details (optional future use)                         */
/* -------------------------------------------------------------------------- */
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name phone")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("❌ FETCH ORDER DETAILS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 🛠️ PATCH: Update order status (ACCEPT / CANCEL)                            */
/* -------------------------------------------------------------------------- */
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const { action } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Only allow pending orders to be updated
    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Order can only be updated while pending",
      });
    }

    if (action === "ACCEPT") {
      order.status = "PROCESSING";
      order.timestampsLog.acceptedAt = new Date();
    } else if (action === "CANCEL") {
      order.status = "CANCELLED";
      order.timestampsLog.cancelledAt = new Date();
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    await order.save();

    // ✅ Optional real-time broadcast (if you have Socket.IO)
    const io = req.app.get("io");
    if (io) {
      io.emit("order-status-updated", {
        slug: order.slug,
        status: order.status,
        timestampsLog: order.timestampsLog,
      });
    }

    res.json({
      success: true,
      message: `Order ${
        action === "ACCEPT" ? "accepted" : "cancelled"
      } successfully`,
      order,
    });
  } catch (err) {
    console.error("❌ UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: err.message,
    });
  }
});

export default router;
