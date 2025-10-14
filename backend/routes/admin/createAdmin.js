import express from "express";
import bcrypt from "bcrypt";
import Admin from "../../models/Admin.js";
import { requireAdmin } from "../../middleware/auth.js";

const router = express.Router();

// POST /admin/create
router.post("/", requireAdmin, async (req, res) => {
  try {
    const creator = req.admin;

    if (!creator.isSuper)
      return res
        .status(403)
        .json({ error: "Only super admin can create other admins" });

    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: "Admin already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      username,
      email,
      passwordHash,
      isSuper: false,
    });

    await newAdmin.save();
    res.json({ success: true, admin: newAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
