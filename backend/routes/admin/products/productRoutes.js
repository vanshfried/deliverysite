import express from "express";
import multer from "multer";
import path from "path";
import Product from "../../../models/Product.js";

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

      const logo = req.files.logo[0].path.replace(/\\/g, "/");
      const images = req.files.images ? req.files.images.map(img => img.path.replace(/\\/g, "/")) : [];

      let parsedSpecs = {};
      let parsedVideos = [];
      try { parsedSpecs = specs ? JSON.parse(specs) : {}; } catch {}
      try { parsedVideos = videos ? JSON.parse(videos) : []; } catch {}

      const product = new Product({
        name,
        description,
        price,
        discountPrice: discountPrice || 0,
        category,
        inStock: inStock !== undefined ? inStock === "true" : true,
        tags: tags ? tags.split(",").map(t => t.trim()) : [],
        specs: parsedSpecs,
        videos: parsedVideos,
        logo,
        images,
      });

      await product.save();
      res.status(201).json({ message: "Product created successfully", product });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

// ---------------- GET ALL PRODUCTS (Admin) ----------------
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
      .populate("category", "name");

    const total = await Product.countDocuments(filter);

    const productList = products.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      price: p.price,
      discountPrice: p.discountPrice,
      finalPrice: p.discountPrice > 0 ? p.discountPrice : p.price,
      category: p.category,
      inStock: p.inStock,
      tags: p.tags,
      logo: p.logo,
      images: p.images,
      specs: p.specs,
      videos: p.videos,
      createdAt: p.createdAt,
    }));

    res.status(200).json({ total, page: Number(page), products: productList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- GET SINGLE PRODUCT (Admin) ----------------
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name");
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

      const updates = { name, description, price, discountPrice, category };
      if (inStock !== undefined) updates.inStock = inStock === "true";
      if (tags) updates.tags = tags.split(",").map(t => t.trim());

      try { updates.specs = specs ? JSON.parse(specs) : {}; } catch {}
      try { updates.videos = videos ? JSON.parse(videos) : []; } catch {}

      if (req.files.logo) updates.logo = req.files.logo[0].path.replace(/\\/g, "/");
      if (req.files.images) updates.images = req.files.images.map(img => img.path.replace(/\\/g, "/"));

      const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!product) return res.status(404).json({ message: "Product not found" });

      res.status(200).json({ message: "Product updated successfully", product });
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
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
