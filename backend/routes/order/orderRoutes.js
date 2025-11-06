import express from "express";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import { requireUser } from "../../middleware/requireUser.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 📦 Place a new order                                                       */
/* -------------------------------------------------------------------------- */
router.post("/", requireUser, async (req, res) => {
  try {
    const { addressId, total, items, paymentMethod } = req.body;

    // ✅ Basic validation
    if (!addressId || !Array.isArray(items) || items.length === 0 || !total) {
      return res.status(400).json({ message: "Missing or invalid order details" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(400).json({ message: "Invalid address" });

    // 🧩 Prepare order items cleanly
    const formattedItems = items.map((i) => ({
      name: i.productName || i.name || "Product",
      quantity: Number(i.quantity) || 1,
      price: Number(i.price) || 0,
    }));

    // 🆔 Generate a short readable order ID
    const slug = `ORD${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 💾 Save to DB
    const order = await Order.create({
      user: user._id,
      items: formattedItems,
      totalAmount: total,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "PENDING",
      slug,
      deliveryAddress: {
        label: address.label,
        houseNo: address.houseNo,
        laneOrSector: address.laneOrSector,
        landmark: address.landmark,
        pincode: address.pincode,
        coords: address.coords,
      },
    });

    // 🔔 Emit admin notification via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.emit("new-order", {
        orderId: order._id,
        slug: order.slug,
        userId: user._id,
        userName: user.name || "User",
        phone: user.phone,
        pincode: address.pincode,
        items: formattedItems.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        totalAmount: total,
      });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 📋 Get all orders of logged-in user                                        */
/* -------------------------------------------------------------------------- */
router.get("/my", requireUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error("FETCH ORDERS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

/* -------------------------------------------------------------------------- */
/* 📄 Get single order by slug (for order details page)                       */
/* -------------------------------------------------------------------------- */
router.get("/:slug", requireUser, async (req, res) => {
  try {
    const order = await Order.findOne({
      slug: req.params.slug,
      user: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (err) {
    console.error("FETCH ORDER BY SLUG ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: err.message,
    });
  }
});

export default router;
