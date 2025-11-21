// backend\routes\Store\publicStores.js
import express from "express";
import Store from "../../models/Store.js";

const router = express.Router();

// Get only approved + active stores
router.get("/", async (req, res) => {
  try {
    const stores = await Store.find({ isActive: true }).select(
      "storeName storeImage address ownerId slug"
    );

    res.json({ stores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
