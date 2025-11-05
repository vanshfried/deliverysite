import express from "express";
import User from "../../models/User.js";
import Order from "../../models/Order.js";

const router = express.Router();

// ✅ Get all users with order summary
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().lean();

    const userIds = users.map(u => u._id);
    const orders = await Order.find({ user: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();

    const summaryMap = {};

    // Aggregate order info per user
    orders.forEach(order => {
      const uid = order.user.toString();
      if (!summaryMap[uid]) {
        summaryMap[uid] = {
          totalSpent: 0,
          orderCount: 0,
          recentOrder: order,
        };
      }

      summaryMap[uid].totalSpent += order.totalAmount;
      summaryMap[uid].orderCount += 1;

      // check if this order is more recent
      if (
        new Date(order.createdAt) >
        new Date(summaryMap[uid].recentOrder.createdAt)
      ) {
        summaryMap[uid].recentOrder = order;
      }
    });

    // merge user + summary
    const data = users.map(u => {
      const s = summaryMap[u._id.toString()] || {};
      return {
        _id: u._id,
        name: u.name || "User",
        phone: u.phone,
        orderCount: s.orderCount || 0,
        totalSpent: s.totalSpent || 0,
        recentOrder: s.recentOrder
          ? {
              slug: s.recentOrder.slug,
              totalAmount: s.recentOrder.totalAmount,
              date: s.recentOrder.createdAt,
            }
          : null,
      };
    });

    res.json({ success: true, users: data });
  } catch (err) {
    console.error("ADMIN USERS FETCH ERROR:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
// ✅ Get one user details + all their orders
router.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name || "User",
        phone: user.phone,
        addresses: user.addresses,
        defaultAddress: user.defaultAddress,
      },
      stats: {
        totalOrders: orders.length,
        totalSpent,
      },
      orders,
    });
  } catch (err) {
    console.error("ADMIN USER DETAIL ERROR:", err);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
});

export default router;
