import express from "express";
import Order from "../../models/Order.js";
import Store from "../../models/Store.js";
import storeOwnerAuth from "../../middleware/storeOwnerAuth.js";

const router = express.Router();

/**
 * ACCEPT ORDER
 * Store Owner moves order from PENDING ➝ PROCESSING
 */
router.patch("/accept/:orderId", storeOwnerAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const ownerId = req.storeOwner._id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check if the store owner owns this store
    const store = await Store.findById(order.store);
    if (!store || store.ownerId.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Not your store order" });
    }

    // Only pending orders can be accepted
    if (order.status !== "PENDING") {
      return res.status(400).json({ message: "Order is not pending" });
    }

    order.status = "PROCESSING";
    order.timestampsLog.acceptedAt = new Date();
    await order.save();

    // Emit socket event to user app
    req.app.get("io").to(order.user.toString()).emit("order-status-updated", {
      orderId,
      status: "PROCESSING",
    });

    res.json({ message: "Order accepted", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * REJECT ORDER
 * Store Owner moves order from PENDING ➝ CANCELLED
 */
router.patch("/reject/:orderId", storeOwnerAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const ownerId = req.storeOwner._id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check ownership
    const store = await Store.findById(order.store);
    if (!store || store.ownerId.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Not your store order" });
    }

    // Only pending orders can be cancelled
    if (order.status !== "PENDING") {
      return res.status(400).json({ message: "Order is not pending" });
    }

    order.status = "CANCELLED";
    order.timestampsLog.cancelledAt = new Date();
    await order.save();

    // Emit socket event to notify user
    req.app.get("io").to(order.user.toString()).emit("order-status-updated", {
      orderId,
      status: "CANCELLED",
    });

    res.json({ message: "Order cancelled", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
/**
 * GET ALL ORDERS OF THIS STORE
 */
router.get("/list", storeOwnerAuth, async (req, res) => {
  try {
    const ownerId = req.storeOwner._id;

    // Find stores owned by this owner
    const store = await Store.findOne({ ownerId });
    if (!store)
      return res.status(404).json({ message: "Store not found for owner" });

    const orders = await Order.find({ store: store._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
/**
 * VERIFY PICKUP OTP
 * Store Owner verifies the OTP given by driver → DRIVER_ASSIGNED ➝ OUT_FOR_DELIVERY
 */
router.patch("/verify-pickup/:orderId", storeOwnerAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { otp } = req.body;
    const ownerId = req.storeOwner._id;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Validate store ownership
    const store = await Store.findById(order.store);
    if (!store || store.ownerId.toString() !== ownerId.toString()) {
      return res.status(403).json({ message: "Not your store order" });
    }

    // Order must be in DRIVER_ASSIGNED state
    if (order.status !== "DRIVER_ASSIGNED") {
      return res
        .status(400)
        .json({ message: "Order is not ready for pickup verification" });
    }

    // Validate OTP
    if (order.pickupOTP !== Number(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check expiry
    if (!order.pickupOTPExpires || order.pickupOTPExpires < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP has expired, ask the driver to regenerate" });
    }

    // SUCCESS → Mark order as out for delivery
    order.status = "OUT_FOR_DELIVERY";
    order.timestampsLog.outForDeliveryAt = new Date();

    // Clear OTP fields
    order.pickupOTP = null;
    order.pickupOTPExpires = null;

    await order.save();

    res.json({
      message: "Pickup verified, order out for delivery",
      order,
    });
  } catch (err) {
    console.error("VERIFY PICKUP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
