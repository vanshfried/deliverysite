// backend/routes/public/product.js
import express from "express";
import Product from "../../models/Product.js";
import SubCategory from "../../models/SubCategory.js";

const router = express.Router();

// -------------------- GET ALL PRODUCTS --------------------
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "subCategory",
        select: "name slug",
        populate: { path: "parentCategory", select: "name slug" },
      })
      .populate("tags", "name");

    const productList = products.map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      discountPrice: p.discountPrice,
      finalPrice: p.finalPrice,
      subCategory: p.subCategory,
      inStock: p.inStock,
      tags: p.tags,
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

// -------------------- GET SINGLE PRODUCT BY SLUG --------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate({
        path: "subCategory",
        select: "name slug",
        populate: { path: "parentCategory", select: "name slug" },
      })
      .populate("tags", "name");

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- GET PRODUCTS BY SUBCATEGORY SLUG --------------------
router.get("/subcategory/slug/:slug", async (req, res) => {
  try {
    const subCategory = await SubCategory.findOne({ slug: req.params.slug });
    if (!subCategory)
      return res.status(404).json({ message: "Subcategory not found" });

    const products = await Product.find({ subCategory: subCategory._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "subCategory",
        select: "name slug",
        populate: { path: "parentCategory", select: "name slug" },
      })
      .populate("tags", "name");

    const productList = products.map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      discountPrice: p.discountPrice,
      finalPrice: p.finalPrice,
      subCategory: p.subCategory,
      inStock: p.inStock,
      tags: p.tags,
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

// -------------------- ✅ GET PRODUCTS BY TAGS (FALLBACK SIMILAR) --------------------
router.get("/tags/:tagIds", async (req, res) => {
  try {
    const tagIds = req.params.tagIds.split(",");

    const products = await Product.find({
      tags: { $in: tagIds }
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "subCategory",
        select: "name slug",
        populate: { path: "parentCategory", select: "name slug" },
      })
      .populate("tags", "name");

    const productList = products.map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      discountPrice: p.discountPrice,
      finalPrice: p.finalPrice,
      subCategory: p.subCategory,
      inStock: p.inStock,
      tags: p.tags,
      logo: p.logo,
      images: p.images,
      specs: p.specs,
      videos: p.videos,
      createdAt: p.createdAt,
    }));

    res.status(200).json({ total: productList.length, products: productList });
  } catch (err) {
    console.error("TAG ROUTE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
