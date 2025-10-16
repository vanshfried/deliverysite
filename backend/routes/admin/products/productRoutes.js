// backend/routes/admin/products/productRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import Product from "../../../models/Product.js";
import Category from "../../../models/Category.js";
import Tag from "../../../models/Tag.js";

const router = express.Router();

// ---------------- Multer Setup ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

// ---------------- CREATE PRODUCT ----------------
router.post(
  "/create",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "images", maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const { name, description, price, discountPrice, category, inStock, tags, specs, videos } = req.body;

      if (!req.files.logo) return res.status(400).json({ message: "Logo is required" });
      if (!name || !price) return res.status(400).json({ message: "Name and price are required" });

      // Validate category
      let validCategory = null;
      if (category) {
        validCategory = await Category.findById(category);
        if (!validCategory) return res.status(400).json({ message: "Invalid category ID" });
      }

      // Validate tags
      let validTags = [];
      if (tags) {
        const tagIds = Array.isArray(tags) ? tags : [tags];
        validTags = await Tag.find({ _id: { $in: tagIds } });
        if (validTags.length !== tagIds.length) {
          return res.status(400).json({ message: "One or more tags are invalid" });
        }

        // ✅ Ensure tags belong to the selected category
        if (validCategory) {
          const invalidTag = validTags.find(t => t.category.toString() !== validCategory._id.toString());
          if (invalidTag) {
            return res.status(400).json({ message: `Tag "${invalidTag.name}" does not belong to the selected category` });
          }
        }
      }

      // Parse JSON fields
      let parsedSpecs = {};
      let parsedVideos = [];
      try { parsedSpecs = specs ? JSON.parse(specs) : {}; } catch {}
      try { parsedVideos = videos ? JSON.parse(videos) : []; } catch {}

      const logo = req.files.logo[0].path.replace(/\\/g, "/");
      const images = req.files.images ? req.files.images.map(img => img.path.replace(/\\/g, "/")) : [];

      const product = new Product({
        name,
        description,
        price,
        discountPrice: discountPrice || 0,
        category: validCategory ? validCategory._id : null,
        inStock: inStock !== undefined ? inStock === "true" : true,
        tags: validTags.map(t => t._id),
        specs: parsedSpecs,
        videos: parsedVideos,
        logo,
        images,
      });

      await product.save();
      res.status(201).json({ message: "✅ Product created successfully", product });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

// ---------------- GET ALL PRODUCTS ----------------
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, inStock } = req.query;
    const filter = {};

    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;
    if (inStock !== undefined) filter.inStock = inStock === "true";

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("category", "name")
      .populate("tags", "name category");

    const total = await Product.countDocuments(filter);

    res.status(200).json({ total, page: Number(page), products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- GET SINGLE PRODUCT ----------------
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("tags", "name category");

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- UPDATE PRODUCT ----------------
router.put(
  "/:id",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "images", maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const { name, description, price, discountPrice, category, inStock, tags, specs, videos } = req.body;
      const updates = {};

      if (name) updates.name = name;
      if (description) updates.description = description;
      if (price !== undefined) updates.price = price;
      if (discountPrice !== undefined) updates.discountPrice = discountPrice;
      if (inStock !== undefined) updates.inStock = inStock === "true";

      // Validate category
      let validCategory = null;
      if (category) {
        validCategory = await Category.findById(category);
        if (!validCategory) return res.status(400).json({ message: "Invalid category ID" });
        updates.category = validCategory._id;
      }

      // Validate tags
      if (tags) {
        const tagIds = Array.isArray(tags) ? tags : [tags];
        const validTags = await Tag.find({ _id: { $in: tagIds } });
        if (validTags.length !== tagIds.length) {
          return res.status(400).json({ message: "One or more tags are invalid" });
        }

        // ✅ Ensure tags belong to the selected category
        if (validCategory) {
          const invalidTag = validTags.find(t => t.category.toString() !== validCategory._id.toString());
          if (invalidTag) {
            return res.status(400).json({ message: `Tag "${invalidTag.name}" does not belong to the selected category` });
          }
        }

        updates.tags = validTags.map(t => t._id);
      }

      // Parse JSON fields
      try { updates.specs = specs ? JSON.parse(specs) : {}; } catch {}
      try { updates.videos = videos ? JSON.parse(videos) : []; } catch {}

      if (req.files.logo) updates.logo = req.files.logo[0].path.replace(/\\/g, "/");
      if (req.files.images) updates.images = req.files.images.map(img => img.path.replace(/\\/g, "/"));

      const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true })
        .populate("category", "name")
        .populate("tags", "name category");

      if (!product) return res.status(404).json({ message: "Product not found" });

      res.status(200).json({ message: "✅ Product updated successfully", product });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

// ---------------- DELETE PRODUCT ----------------
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "✅ Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
