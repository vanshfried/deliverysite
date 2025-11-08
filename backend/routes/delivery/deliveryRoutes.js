import express from "express";
import Order from "../../models/Order.js";
import DeliveryBoy from "../../models/DeliveryBoy.js";
import { requireDeliveryBoy } from "../../middleware/requireDeliveryBoy.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 🚀 GET: All Available Orders for Delivery Partner                          */
/* -------------------------------------------------------------------------- */
router.get("/available", requireDeliveryBoy, async (req, res) => {
  try {
    const deliveryBoy = req.user;

    // 🛑 Block if delivery boy is inactive
    if (!deliveryBoy.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Activate to see available orders.",
      });
    }

    // 🛑 Block if they already have an ongoing delivery
    if (deliveryBoy.currentOrder) {
      return res.status(403).json({
        success: false,
        message: "You already have an active delivery. Complete it first.",
      });
    }

    const orders = await Order.find({
      status: "PROCESSING",
      deliveryBoy: null,
    })
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error("❌ FETCH AVAILABLE ORDERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available orders",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 🛵 PATCH: Accept an Order                                                  */
/* -------------------------------------------------------------------------- */
router.patch("/accept/:id", requireDeliveryBoy, async (req, res) => {
  try {
    const deliveryBoy = req.user;

    if (!deliveryBoy.isActive) {
      return res.status(403).json({
        success: false,
        message: "Activate your account to accept orders.",
      });
    }

    if (deliveryBoy.currentOrder) {
      return res.status(403).json({
        success: false,
        message: "Complete your current delivery before accepting a new one.",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (order.status !== "PROCESSING" || order.deliveryBoy)
      return res.status(400).json({
        success: false,
        message: "Order not available for delivery assignment",
      });

    // Assign order
    order.deliveryBoy = deliveryBoy._id;
    order.status = "OUT_FOR_DELIVERY";
    order.timestampsLog.outForDeliveryAt = new Date();
    await order.save();

    // Update delivery boy
    await DeliveryBoy.findByIdAndUpdate(deliveryBoy._id, {
      $inc: { "stats.accepted": 1 },
      $set: { currentOrder: order._id },
    });

    res.json({ success: true, message: "Order accepted", order });
  } catch (err) {
    console.error("❌ ACCEPT ORDER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to accept order",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 📦 PATCH: Mark Order as Delivered                                          */
/* -------------------------------------------------------------------------- */
router.patch("/delivered/:id", requireDeliveryBoy, async (req, res) => {
  try {
    const deliveryBoy = req.user;

    const order = await Order.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (String(order.deliveryBoy) !== String(deliveryBoy._id))
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this order",
      });

    order.status = "DELIVERED";
    order.timestampsLog.deliveredAt = new Date();
    await order.save();

    await DeliveryBoy.findByIdAndUpdate(deliveryBoy._id, {
      $inc: { "stats.delivered": 1 },
      $set: { currentOrder: null },
    });

    res.json({ success: true, message: "Order marked as delivered", order });
  } catch (err) {
    console.error("❌ DELIVER ORDER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to mark order as delivered",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 📋 GET: All Orders Assigned to Current Delivery Partner                    */
/* -------------------------------------------------------------------------- */
router.get("/my", requireDeliveryBoy, async (req, res) => {
  try {
    const deliveryBoy = req.user;

    const orders = await Order.find({ deliveryBoy: deliveryBoy._id })
      .populate("user", "name phone")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error("❌ FETCH MY ORDERS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned orders",
      error: err.message,
    });
  }
});

export default router;
