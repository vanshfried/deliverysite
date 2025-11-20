import express from "express";
import Product from "../../models/Product.js";
import Store from "../../models/Store.js";
import storeOwnerAuth from "../../middleware/storeOwnerAuth.js"; // you'll create this

const router = express.Router();

// 🔹 Get all products for this store owner
router.get("/", storeOwnerAuth, async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.owner.id });

    const products = await Product.find({ store: store._id });

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: "Error loading products" });
  }
});

// 🔹 Add new product
router.post("/add", storeOwnerAuth, async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.owner.id });

    const newProduct = await Product.create({
      ...req.body,
      store: store._id, // important
    });

    res.json({ message: "Product added", product: newProduct });
  } catch (err) {
    res.status(500).json({ message: "Error creating product" });
  }
});

// 🔹 Edit product
router.put("/edit/:id", storeOwnerAuth, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      store: req.store._id,
    });

    if (!product) return res.status(404).json({ message: "Not found" });

    Object.assign(product, req.body);
    await product.save();

    res.json({ message: "Updated", product });
  } catch (err) {
    res.status(500).json({ message: "Error updating product" });
  }
});

// 🔹 Delete product
router.delete("/delete/:id", storeOwnerAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      store: req.store._id,
    });

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

export default router;
