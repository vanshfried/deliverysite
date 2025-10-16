// backend/routes/admin/products/extraRoutes.js
import express from "express";
import Category from "../../../models/Category.js";
import SubCategory from "../../../models/SubCategory.js";
import Tag from "../../../models/Tag.js";
import { requireAdmin } from "../../../middleware/auth.js";

const router = express.Router();

/* -------------------- GET CATEGORIES -------------------- */
router.get("/categories", requireAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({
      categories: categories.map((c) => ({ _id: c._id, name: c.name })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- GET SUBCATEGORIES -------------------- */
router.get("/subcategories", requireAdmin, async (req, res) => {
  try {
    const subcategories = await SubCategory.find()
      .populate("parentCategory", "name")
      .sort({ name: 1 });

    res.json({
      subcategories: subcategories.map((sc) => ({
        _id: sc._id,
        name: sc.name,
        parentCategory: sc.parentCategory
          ? { _id: sc.parentCategory._id, name: sc.parentCategory.name }
          : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- GET TAGS -------------------- */
router.get("/tags", requireAdmin, async (req, res) => {
  try {
    const tags = await Tag.find()
      .populate("category", "name")
      .sort({ name: 1 });

    res.json({
      tags: tags.map((t) => ({
        _id: t._id,
        name: t.name,
        category: t.category
          ? { _id: t.category._id, name: t.category.name }
          : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
