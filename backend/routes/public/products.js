// backend/routes/public/product.js
import express from "express";
import Product from "../../models/Product.js";
import SubCategory from "../../models/SubCategory.js";
import Order from "../../models/Order.js";
import { requireUser } from "../../middleware/requireUser.js";

const router = express.Router();

// ===========================================================
// 🔹 GET ALL PRODUCTS
// ===========================================================
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

    res.status(200).json({
      total: products.length,
      products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===========================================================
// 🔹 GET SINGLE PRODUCT BY SLUG
// ===========================================================
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

// ===========================================================
// 🔹 GET PRODUCTS BY SUBCATEGORY SLUG
// ===========================================================
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

    res.status(200).json({ total: products.length, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===========================================================
// 🔹 GET PRODUCTS BY TAGS
// ===========================================================
router.get("/tags/:tagIds", async (req, res) => {
  try {
    const tagIds = req.params.tagIds.split(",");

    const products = await Product.find({
      tags: { $in: tagIds },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "subCategory",
        select: "name slug",
        populate: { path: "parentCategory", select: "name slug" },
      })
      .populate("tags", "name");

    res.status(200).json({ total: products.length, products });
  } catch (err) {
    console.error("TAG ROUTE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===========================================================
// 🧩 REVIEWS & RATINGS ROUTES
// ===========================================================

// --- GET all reviews for a product ---
router.get("/:id/reviews", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "reviews.user",
      "name phone"
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product.reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// --- POST (Add or Update) a Review ---
router.post("/:id/reviews", requireUser, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Find if user already reviewed
    const existingReview = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      // Update existing review
      existingReview.rating = Number(rating);
      existingReview.comment = comment;
    } else {
      // Add new review
      product.reviews.push({
        user: req.user._id,
        rating: Number(rating),
        comment,
      });
    }

    // Recalculate ratings
    product.numReviews = product.reviews.length;
    product.averageRating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review saved", product });
  } catch (err) {
    console.error("Error saving review:", err);
    res.status(500).json({ message: "Error saving review" });
  }
});

// --- DELETE a review ---
router.delete("/:id/reviews/:reviewId", requireUser, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const reviewIndex = product.reviews.findIndex(
      (r) => r._id.toString() === req.params.reviewId
    );
    if (reviewIndex === -1)
      return res.status(404).json({ message: "Review not found" });

    const review = product.reviews[reviewIndex];
    if (review.user.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ message: "Not authorized to delete this review" });

    product.reviews.splice(reviewIndex, 1);

    // Recalculate ratings
    product.numReviews = product.reviews.length;
    product.averageRating =
      product.reviews.length > 0
        ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
          product.reviews.length
        : 0;

    await product.save();

    res.json({ message: "Review deleted successfully", product });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ message: "Error deleting review" });
  }
});

export default router;
