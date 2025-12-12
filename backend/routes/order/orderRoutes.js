import express from "express";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";
import { requireUser } from "../../middleware/requireUser.js";

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* 🛒 Helper: Validate payment method                                          */
/* -------------------------------------------------------------------------- */
const isValidPayment = (pm) => ["UPI", "COD"].includes(pm);

/* -------------------------------------------------------------------------- */
/* 🛒 Helper: Generate order slug                                              */
/* -------------------------------------------------------------------------- */
const generateSlug = () =>
  `ORD${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

/* -------------------------------------------------------------------------- */
/* 📦 Place a new order                                                       */
/* -------------------------------------------------------------------------- */
router.post("/", requireUser, async (req, res) => {
  try {
    const { addressId, items, paymentMethod } = req.body;

    if (!addressId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid order details",
      });
    }

    if (!isValidPayment(paymentMethod)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment method" });
    }

    const user = await User.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address)
      return res
        .status(400)
        .json({ success: false, message: "Invalid delivery address" });

    /* --------------------------------------------- */
    /* 🔍 Fetch & validate all items + same-store rule */
    /* --------------------------------------------- */
    const formattedItems = [];
    let storeId = null;

    for (const item of items) {
      const product = await Product.findById(item.productId).lean();
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      // Ensuring all items come from same store
      if (!storeId) storeId = product.store;
      else if (storeId.toString() !== product.store.toString()) {
        return res.status(400).json({
          success: false,
          message: "All items must belong to the same store",
        });
      }

      formattedItems.push({
        product: product._id,
        name: product.name,
        quantity: Number(item.quantity) || 1,
        price:
          product.discountPrice > 0 ? product.discountPrice : product.price,
      });
    }

    /* --------------------------------------------- */
    /* 💰 Calculate total                             */
    /* --------------------------------------------- */
    const totalAmount = formattedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    /* --------------------------------------------- */
    /* 📝 Create order                                 */
    /* --------------------------------------------- */
    const order = await Order.create({
      user: user._id,
      store: storeId,
      items: formattedItems,
      totalAmount,
      paymentMethod,
      paymentStatus: "PENDING",
      slug: generateSlug(),
      deliveryAddress: {
        label: address.label,
        houseNo: address.houseNo,
        laneOrSector: address.laneOrSector,
        landmark: address.landmark,
        pincode: address.pincode,
        coords: address.coords,
      },
    });

    /* --------------------------------------------- */
    /* 🔔 Notify admin via socket.io                  */
    /* --------------------------------------------- */
    const io = req.app.get("io");
    if (io) {
      io.emit("new-order", {
        orderId: order._id,
        slug: order.slug,
        userId: user._id,
        userName: user.name || "User",
        phone: user.phone,
        pincode: address.pincode,
        items: formattedItems,
        totalAmount,
        storeId,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 📋 Get all user orders                                                     */
/* -------------------------------------------------------------------------- */
router.get("/my", requireUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("store", "name")
      .lean();

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error("FETCH ORDERS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: err.message,
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 📄 Get single order by slug                                                */
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

    // Ensure safe deliveryBoy location
    let deliveryBoyLocation = null;
    if (order.deliveryBoy?.location?.coordinates) {
      const [lon, lat] = order.deliveryBoy.location.coordinates;
      deliveryBoyLocation = { lat, lon };
    }

    return res.json({
      success: true,
      order: { ...order, deliveryBoyLocation },
    });
  } catch (err) {
    console.error("FETCH ORDER BY SLUG ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: err.message,
    });
  }
});

export default router;
