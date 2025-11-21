// backend\routes\Store\storeProducts.js
import express from "express";
import Product from "../../models/Product.js";
import storeOwnerAuth from "../../middleware/storeOwnerAuth.js";
import multer from "multer";

const router = express.Router();

// Multer for base64 uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ----------------------------
// GET store owner's products
// ----------------------------
router.get("/", storeOwnerAuth, async (req, res) => {
  try {
    const store = req.store;
    if (!store) return res.status(400).json({ message: "Store not found" });

    const products = await Product.find({ store: store._id });

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: "Error loading products" });
  }
});

// ----------------------------
// ADD new product
// ----------------------------
router.post(
  "/add",
  storeOwnerAuth,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "images", maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      if (!req.store)
        return res.status(400).json({ message: "Store not found" });

      const body = req.body;

      // Convert logo & images to Base64
      const logo =
        req.files.logo?.[0]
          ? `data:${req.files.logo[0].mimetype};base64,${req.files.logo[0].buffer.toString(
              "base64"
            )}`
          : null;

      const images = req.files.images
        ? req.files.images.map(
            (img) =>
              `data:${img.mimetype};base64,${img.buffer.toString("base64")}`
          )
        : [];

      const specs = body.specs ? JSON.parse(body.specs) : {};

      const product = await Product.create({
        name: body.name,
        price: body.price,
        discountPrice: body.discountPrice || 0,
        description: body.description,
        inStock: body.inStock,
        subCategory: body.subCategory,
        tags: body.tags ? [].concat(body.tags) : [],
        specs,
        logo,
        images,
        store: req.store._id,
      });

      return res.json({
        message: "Product added",
        product,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error creating product" });
    }
  }
);

// ----------------------------
// EDIT product
// ----------------------------
router.put(
  "/edit/:id",
  storeOwnerAuth,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "images", maxCount: 4 },
  ]),
  async (req, res) => {
    try {
      const product = await Product.findOne({
        _id: req.params.id,
        store: req.store._id,
      });

      if (!product) return res.status(404).json({ message: "Not found" });

      const body = req.body;

      product.name = body.name;
      product.price = body.price;
      product.discountPrice = body.discountPrice;
      product.description = body.description;
      product.inStock = body.inStock;
      product.subCategory = body.subCategory;
      product.tags = body.tags ? [].concat(body.tags) : [];
      product.specs = body.specs ? JSON.parse(body.specs) : product.specs;

      // New logo
      if (req.files.logo) {
        const file = req.files.logo[0];
        product.logo = `data:${file.mimetype};base64,${file.buffer.toString(
          "base64"
        )}`;
      }

      // New images
      if (req.files.images) {
        product.images = req.files.images.map(
          (img) =>
            `data:${img.mimetype};base64,${img.buffer.toString("base64")}`
        );
      }

      await product.save();

      res.json({ message: "Updated", product });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Error updating product" });
    }
  }
);

// ----------------------------
// DELETE product
// ----------------------------
router.delete("/delete/:id", storeOwnerAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      store: req.store._id,
    });

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    return res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product" });
  }
});

export default router;
