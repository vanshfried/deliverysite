import express from "express";
import Category from "../../../models/Category.js";
import Tag from "../../../models/Tag.js";
import { requireAdmin, requireSuperAdmin } from "../../../middleware/auth.js";

const router = express.Router();

/* -------------------- GET CATEGORIES -------------------- */
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
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // Delete all tags under this category
    await Tag.deleteMany({ category: category._id });

    // Delete the category itself
    await category.deleteOne();

    res.json({ message: "✅ Category and its tags deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


/* -------------------- GET TAGS -------------------- */
router.get("/tags", requireAdmin, async (req, res) => {
  try {
    const tags = await Tag.find().populate("category", "name").sort({ name: 1 });
    res.json({
      tags: tags.map(t => ({
        _id: t._id,
        name: t.name,
        category: t.category ? { _id: t.category._id, name: t.category.name } : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- TAGS (Superadmin only) -------------------- */
router.post("/tags", requireSuperAdmin, async (req, res) => {
  try {
    const { name, category } = req.body; // accept 'category' directly
    if (!name || !category)
      return res.status(400).json({ error: "Tag name and category are required" });

    const categoryObj = await Category.findById(category);
    if (!categoryObj) return res.status(400).json({ error: "Invalid category" });

    const existing = await Tag.findOne({ name, category });
    if (existing) return res.status(400).json({ error: "Tag already exists in this category" });

    const tag = new Tag({ name, category });
    await tag.save();
    await tag.populate("category", "name"); // populate for frontend

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
