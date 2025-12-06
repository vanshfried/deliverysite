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
    const deliveryBoy = await DeliveryBoy.findById(req.user._id);

    if (!deliveryBoy.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Activate to see available orders.",
      });
    }

    if (deliveryBoy.currentOrder) {
      return res.status(403).json({
        success: false,
        message: "You already have an active delivery. Complete it first.",
      });
    }

    const orders = await Order.find({
      status: "PROCESSING",
      deliveryBoy: null,
      _id: { $nin: deliveryBoy.rejectedOrders || [] },
    })
      .populate("user", "name phone")
      .populate("store", "storeName address location phone") // ✅ STORE LOCATION ADDED
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

    order.deliveryBoy = deliveryBoy._id;
    order.status = "OUT_FOR_DELIVERY";
    order.timestampsLog.outForDeliveryAt = new Date();
    await order.save();

    await DeliveryBoy.findByIdAndUpdate(deliveryBoy._id, {
      $inc: { "stats.accepted": 1 },
      $set: { currentOrder: order._id },
    });

    // ✅ SEND POPULATED ORDER WITH STORE LOCATION
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name phone")
      .populate("store", "storeName address location phone")
      .lean();

    res.json({
      success: true,
      message: "Order accepted",
      order: populatedOrder,
    });
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
      .populate("store", "storeName address location phone") // ✅ STORE LOCATION ADDED
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

/* -------------------------------------------------------------------------- */
/* ❌ PATCH: Reject/Ignore an Order                                           */
/* -------------------------------------------------------------------------- */
router.patch("/reject/:id", requireDeliveryBoy, async (req, res) => {
  try {
    const deliveryBoy = req.user;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (
      order.deliveryBoy &&
      String(order.deliveryBoy) !== String(deliveryBoy._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this order",
      });
    }

    await DeliveryBoy.findByIdAndUpdate(deliveryBoy._id, {
      $addToSet: { rejectedOrders: order._id },
      $set: { currentOrder: null },
      $inc: { "stats.ignored": 1 },
    });

    res.json({ success: true, message: "Order rejected" });
  } catch (err) {
    console.error("❌ REJECT ORDER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to reject order",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 📍 PATCH: Update Delivery Boy Live Location                                */
/* -------------------------------------------------------------------------- */
router.patch("/location", requireDeliveryBoy, async (req, res) => {
  try {
    const { lat, lon } = req.body;

    if (typeof lat !== "number" || typeof lon !== "number") {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          location: {
            type: "Point",
            coordinates: [lon, lat],
          },
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Location updated successfully",
      location: deliveryBoy.location,
    });
  } catch (err) {
    console.error("❌ UPDATE LOCATION ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update location",
      error: err.message,
    });
  }
});

export default router;
