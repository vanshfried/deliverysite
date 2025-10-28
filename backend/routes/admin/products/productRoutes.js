import express from "express";
import multer from "multer";
import path from "path";
import Product from "../../../models/Product.js";
import SubCategory from "../../../models/SubCategory.js";
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
      const { name, description, price, discountPrice, subCategory, inStock, tags, specs, videos } = req.body;

      if (!req.files.logo) return res.status(400).json({ message: "Logo is required" });
      if (!name || !price) return res.status(400).json({ message: "Name and price are required" });

      // ✅ Normalize & Check Duplicate Name
      const normalizedName = name.trim().replace(/\s+/g, " ").toLowerCase();
      const existingName = await Product.findOne({
        name: { $regex: `^${normalizedName}$`, $options: "i" }
      });
      if (existingName) {
        return res.status(400).json({
          message: "A product with this name already exists. Please choose a different name."
        });
      }

      // Validate subCategory
      let validSubCategory = null;
      if (subCategory) {
        validSubCategory = await SubCategory.findById(subCategory).populate("parentCategory");
        if (!validSubCategory) return res.status(400).json({ message: "Invalid sub-category ID" });
      }

      // Validate tags
      let validTags = [];
      if (tags) {
        const tagIds = Array.isArray(tags) ? tags : [tags];
        validTags = await Tag.find({ _id: { $in: tagIds } });

        if (validTags.length !== tagIds.length)
          return res.status(400).json({ message: "One or more tags are invalid" });

        if (validSubCategory) {
          const invalidTag = validTags.find(
            t => t.category.toString() !== validSubCategory.parentCategory._id.toString()
          );
          if (invalidTag) {
            return res.status(400).json({
              message: `Tag "${invalidTag.name}" does not belong to the selected sub-category`,
            });
          }
        }
      }

      let parsedSpecs = {};
      let parsedVideos = [];
      try { parsedSpecs = specs ? JSON.parse(specs) : {}; } catch {}
      try { parsedVideos = videos ? JSON.parse(videos) : []; } catch {}

      const logo = req.files.logo[0].path.replace(/\\/g, "/");
      const images = req.files.images ? req.files.images.map(img => img.path.replace(/\\/g, "/")) : [];

      const product = new Product({
        name: name.trim().replace(/\s+/g, " "), // ✅ cleaned name
        description,
        price,
        discountPrice: discountPrice || 0,
        subCategory: validSubCategory ? validSubCategory._id : null,
        inStock: inStock !== undefined ? inStock === "true" : true,
        tags: validTags.map(t => t._id),
        specs: parsedSpecs,
        videos: parsedVideos,
        logo,
        images,
      });

      await product.save();

      const populatedProduct = await Product.findById(product._id)
        .populate({
          path: "subCategory",
          select: "name",
          populate: { path: "parentCategory", select: "name" }
        })
        .populate("tags", "name category");

      res.status(201).json({ message: "✅ Product created successfully", product: populatedProduct });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

// ---------------- GET ALL PRODUCTS ----------------
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, subCategory, inStock } = req.query;
    const filter = {};

    if (search) filter.name = { $regex: search, $options: "i" };
    if (subCategory) filter.subCategory = subCategory;
    if (inStock !== undefined) filter.inStock = inStock === "true";

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: "subCategory",
        select: "name",
        populate: { path: "parentCategory", select: "name" }
      })
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
      .populate({
        path: "subCategory",
        select: "name",
        populate: { path: "parentCategory", select: "name" }
      })
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
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });

      const { name, description, price, discountPrice, subCategory, inStock, tags, specs, videos } = req.body;

      // ✅ Duplicate name + normalize + slug auto-update
      if (name) {
        const normalizedName = name.trim().replace(/\s+/g, " ").toLowerCase();
        const existingName = await Product.findOne({
          _id: { $ne: product._id }, // avoid matching itself
          name: { $regex: `^${normalizedName}$`, $options: "i" }
        });

        if (existingName) {
          return res.status(400).json({
            message: "A product with this name already exists. Please choose a different name."
          });
        }

        product.name = name.trim().replace(/\s+/g, " ");
      }

      if (description) product.description = description;
      if (price !== undefined) product.price = price;
      if (discountPrice !== undefined) product.discountPrice = discountPrice;
      if (inStock !== undefined) product.inStock = inStock === "true";

      if (subCategory) {
        const validSubCategory = await SubCategory.findById(subCategory).populate("parentCategory");
        if (!validSubCategory) return res.status(400).json({ message: "Invalid sub-category ID" });
        product.subCategory = validSubCategory._id;
      }

      if (tags) {
        const tagIds = Array.isArray(tags) ? tags : [tags];
        const validTags = await Tag.find({ _id: { $in: tagIds } });

        if (validTags.length !== tagIds.length)
          return res.status(400).json({ message: "One or more tags are invalid" });

        product.tags = validTags.map(t => t._id);
      }

      try { product.specs = specs ? JSON.parse(specs) : {}; } catch {}
      try { product.videos = videos ? JSON.parse(videos) : []; } catch {}

      if (req.files.logo) product.logo = req.files.logo[0].path.replace(/\\/g, "/");
      if (req.files.images) product.images = req.files.images.map(img => img.path.replace(/\\/g, "/"));

      await product.save(); // ✅ runs slug middleware

      const populatedProduct = await Product.findById(product._id)
        .populate({
          path: "subCategory",
          select: "name",
          populate: { path: "parentCategory", select: "name" }
        })
        .populate("tags", "name category");

      res.status(200).json({ message: "✅ Product updated successfully", product: populatedProduct });

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
