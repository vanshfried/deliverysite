// backend/routes/admin/adminLogin.js

import express from "express";
import bcrypt from "bcrypt";
import Admin from "../../models/Admin.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, error: "Email and password required" });
  }

  try {
    const admin = await Admin.findOne({ email }).lean();
    if (!admin) {
      return res
        .status(400)
        .json({ success: false, error: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials" });
    }

    const adminToken = jwt.sign(
      { id: admin._id, isSuper: admin.isSuper },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Proper cookie settings
    res.cookie("adminToken", adminToken, {
      httpOnly: true,
      secure: true, // ✅ For cross-site cookie support
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        isSuper: admin.isSuper,
      },
    });
  } catch (err) {
    console.error("adminLogin error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Server error" });
  }
});

export default router;
