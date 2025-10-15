// backend/routes/admin/products/categoryTagAdminRoutes.js
import express from "express";
import Category from "../../../models/Category.js";
import Tag from "../../../models/Tag.js";
import { requireAdmin, requireSuperAdmin } from "../../../middleware/auth.js";

const router = express.Router();

/* -------------------- GET CATEGORIES -------------------- */
// Any admin can fetch
router.get("/categories", requireAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories: categories.map(c => ({ _id: c._id, name: c.name })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- CATEGORIES (Superadmin only) -------------------- */
router.post("/categories", requireSuperAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ error: "Category already exists" });

    const category = new Category({ name });
    await category.save();
    res.status(201).json({ message: "✅ Category created", category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/categories/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Category name is required" });

    const category = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json({ message: "✅ Category updated", category });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/categories/:id", requireSuperAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ message: "✅ Category deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- GET TAGS -------------------- */
// Any admin can fetch
router.get("/tags", requireAdmin, async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.json({ tags: tags.map(t => ({ _id: t._id, name: t.name })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- TAGS (Superadmin only) -------------------- */
router.post("/tags", requireSuperAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Tag name is required" });

    const existing = await Tag.findOne({ name });
    if (existing) return res.status(400).json({ error: "Tag already exists" });

    const tag = new Tag({ name });
    await tag.save();
    res.status(201).json({ message: "✅ Tag created", tag });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/tags/:id", requireSuperAdmin, async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    res.json({ message: "✅ Tag deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
