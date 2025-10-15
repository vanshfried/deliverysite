//backend/routees/public/product.js
import express from "express";
import Product from "../../models/Product.js";

const router = express.Router();

// GET all products (public)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate("category", "name")
      .populate("tags", "name"); // ✅ populate tags with name

    const productList = products.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      discountPrice: p.discountPrice,
      finalPrice: p.discountPrice > 0 ? p.discountPrice : p.price,
      category: p.category,
      inStock: p.inStock,
      tags: p.tags, // now contains { _id, name }
      logo: p.logo,
      images: p.images,
      specs: p.specs,
      videos: p.videos,
      createdAt: p.createdAt,
    }));

    res.status(200).json({ total: productList.length, products: productList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET single product by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("tags", "name"); // ✅ populate tags with name

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
