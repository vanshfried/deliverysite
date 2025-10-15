// backend/routes/admin/products/extraRoutes.js
import express from "express";
import Category from "../../../models/Category.js";
import Tag from "../../../models/Tag.js";
import { requireAdmin, requireSuperAdmin } from "../../../middleware/auth.js";

const router = express.Router();

// -------------------- GET CATEGORIES --------------------
// Only superadmin can create/edit categories, but anyone admin can view
router.get("/categories", requireAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    // return only _id and name
    const formatted = categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
    }));
    res.json({ categories: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- GET TAGS --------------------
// Only superadmin can create/edit tags, but any admin can view
router.get("/tags", requireAdmin, async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    const formatted = tags.map((tag) => ({
      _id: tag._id,
      name: tag.name,
    }));
    res.json({ tags: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
