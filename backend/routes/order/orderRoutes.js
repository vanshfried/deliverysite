import express from "express";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";
import { requireUser } from "../../middleware/requireUser.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 📦 Place a new order                                                       */
/* -------------------------------------------------------------------------- */
router.post("/", requireUser, async (req, res) => {
  try {
    const { addressId, total, items, paymentMethod } = req.body;

    // ✅ Validate request
    if (!addressId || !Array.isArray(items) || items.length === 0 || !total) {
      return res
        .status(400)
        .json({ message: "Missing or invalid order details" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(400).json({ message: "Invalid address" });

    // 🧩 Format items, fetch product info
    const formattedItems = [];
    let storeId = null;

    for (const item of items) {
      const product = await Product.findById(item.productId).lean();
      if (!product)
        return res
          .status(404)
          .json({ message: `Product not found: ${item.productId}` });

      // Check store consistency
      if (!storeId) storeId = product.store;
      else if (storeId.toString() !== product.store.toString()) {
        return res
          .status(400)
          .json({ message: "All items must belong to the same store" });
      }

      formattedItems.push({
        product: product._id,
        name: product.name,
        quantity: Number(item.quantity) || 1,
        price: Number(item.discountPrice || product.price),
      });
    }

    // 🆔 Generate a short order slug
    const slug = `ORD${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    // 💾 Save order
    const order = await Order.create({
      user: user._id,
      store: storeId,
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
        storeId,
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
      .populate("store", "name") // optional: include store name
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
    })
      .populate("deliveryBoy", "name phone location")
      .populate("store", "name")
      .lean();

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    let deliveryBoyLocation = null;
    if (order.deliveryBoy && order.deliveryBoy.location) {
      const coords = order.deliveryBoy.location.coordinates;
      deliveryBoyLocation = { lat: coords[1], lon: coords[0] };
    }

    res.json({
      success: true,
      order: { ...order, deliveryBoyLocation },
    });
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
