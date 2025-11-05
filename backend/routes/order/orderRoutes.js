import express from "express";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import { requireUser } from "../../middleware/requireUser.js";
import slugify from "slugify";

const router = express.Router();

/* 📦 Place new order */
/* 📦 Place new order */
router.post("/", requireUser, async (req, res) => {
  try {
    const { addressId, total, items, paymentMethod } = req.body;

    if (!addressId || !items || items.length === 0)
      return res.status(400).json({ message: "Missing order details" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(400).json({ message: "Invalid address" });

    const formattedItems = items.map((i) => ({
      name: i.productName || i.name || "Product",
      quantity: i.quantity,
      price: i.price,
    }));

    function generateOrderId() {
      const unique = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `ORD${unique}`;
    }

    const slug = generateOrderId();

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

    // 🔔 Emit admin notification
    const io = req.app.get("io");
    io.emit("new-order", {
      userId: user._id,
      phone: user.phone,
      userName: user.name || "User",
      pincode: address.pincode,
      items: formattedItems.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      totalAmount: total,
    });

    res.json({ success: true, message: "Order placed successfully", order });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    res.status(500).json({ message: "Order failed", error: err.message });
  }
});


/* 📋 Get my orders */
router.get("/my", requireUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, orders });
  } catch (err) {
    console.error("FETCH ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* 📄 Get order by slug */
router.get("/:slug", requireUser, async (req, res) => {
  try {
    const order = await Order.findOne({
      slug: req.params.slug,
      user: req.user._id,
    }).lean();

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    res.json({ success: true, order });
  } catch (err) {
    console.error("FETCH ORDER BY SLUG ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order by slug",
      error: err.message,
    });
  }
});

export default router;
