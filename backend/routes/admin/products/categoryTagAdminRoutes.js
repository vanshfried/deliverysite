// backend/routes/admin/products/categoryTagAdminroutes.js
// backend/routes/admin/products/categoryTagAdminroutes.js
import express from "express";
import Category from "../../../models/Category.js";
import SubCategory from "../../../models/SubCategory.js";
import Tag from "../../../models/Tag.js";
import { requireAdmin, requireSuperAdmin } from "../../../middleware/auth.js";

const router = express.Router();

/* -------------------- CATEGORIES -------------------- */

// GET CATEGORIES
router.get("/categories", requireAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({
      categories: categories.map((c) => ({ _id: c._id, name: c.name })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE CATEGORY (Superadmin only)
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

// UPDATE CATEGORY
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

// DELETE CATEGORY (and its tags & subcategories)
router.delete("/categories/:id", requireSuperAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    // Delete all tags and subcategories under this category
    await Tag.deleteMany({ category: category._id });
    await SubCategory.deleteMany({ parentCategory: category._id });

    await category.deleteOne();

    res.json({ message: "✅ Category, its subcategories, and tags deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- SUBCATEGORIES -------------------- */

// GET SUBCATEGORIES
router.get("/subcategories", requireAdmin, async (req, res) => {
  try {
    const subcategories = await SubCategory.find().populate("parentCategory", "name").sort({ name: 1 });
    res.json({
      subcategories: subcategories.map((sc) => ({
        _id: sc._id,
        name: sc.name,
        parentCategory: sc.parentCategory ? { _id: sc.parentCategory._id, name: sc.parentCategory.name } : null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE SUBCATEGORY
router.post("/subcategories", requireSuperAdmin, async (req, res) => {
  try {
    const { name, parentCategory } = req.body;
    if (!name || !parentCategory)
      return res.status(400).json({ error: "Subcategory name and parent category are required" });

    const categoryObj = await Category.findById(parentCategory);
    if (!categoryObj) return res.status(400).json({ error: "Invalid parent category" });

    const existing = await SubCategory.findOne({ name, parentCategory });
    if (existing) return res.status(400).json({ error: "Subcategory already exists under this category" });

    const subcategory = new SubCategory({ name, parentCategory });
    await subcategory.save();
    await subcategory.populate("parentCategory", "name");

    res.status(201).json({ message: "✅ Subcategory created", subcategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE SUBCATEGORY
router.put("/subcategories/:id", requireSuperAdmin, async (req, res) => {
  try {
    const { name, parentCategory } = req.body;
    if (!name || !parentCategory)
      return res.status(400).json({ error: "Subcategory name and parent category are required" });

    const categoryObj = await Category.findById(parentCategory);
    if (!categoryObj) return res.status(400).json({ error: "Invalid parent category" });

    const subcategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { name, parentCategory },
      { new: true }
    ).populate("parentCategory", "name");

    if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });

    res.json({ message: "✅ Subcategory updated", subcategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE SUBCATEGORY
router.delete("/subcategories/:id", requireSuperAdmin, async (req, res) => {
  try {
    const subcategory = await SubCategory.findById(req.params.id);
    if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });

    // Optional: Delete products under this subcategory
    // await Product.deleteMany({ subCategory: subcategory._id });

    await subcategory.deleteOne();

    res.json({ message: "✅ Subcategory deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* -------------------- TAGS -------------------- */

// GET TAGS
router.get("/tags", requireAdmin, async (req, res) => {
  try {
    const tags = await Tag.find().populate("category", "name").sort({ name: 1 });
    res.json({
      tags: tags.map((t) => ({
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

// CREATE TAG
router.post("/tags", requireSuperAdmin, async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category)
      return res.status(400).json({ error: "Tag name and category are required" });

    const categoryObj = await Category.findById(category);
    if (!categoryObj) return res.status(400).json({ error: "Invalid category" });

    const existing = await Tag.findOne({ name, category });
    if (existing) return res.status(400).json({ error: "Tag already exists in this category" });

    const tag = new Tag({ name, category });
    await tag.save();
    await tag.populate("category", "name");

    res.status(201).json({ message: "✅ Tag created", tag });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE TAG
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
