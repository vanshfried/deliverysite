import express from "express";
import Store from "../../models/Store.js";
import Product from "../../models/Product.js";

const router = express.Router();

// GET store details via slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const store = await Store.findOne({ slug }).select(
      "storeName storeImage address description openingTime closingTime slug"
    );

    if (!store) return res.status(404).json({ message: "Store not found" });

    const products = await Product.find({ store: store._id }).select(
      "name price discountPrice logo inStock"
    );

    res.json({
      store,
      products,
    });
  } catch (err) {
    console.error("Store details error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
