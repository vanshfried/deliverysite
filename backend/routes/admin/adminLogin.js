import express from "express";
import bcrypt from "bcrypt";
import Admin from "../../models/Admin.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, error: "Missing fields" });

  try {
    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(400).json({ success: false, error: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch)
      return res.status(400).json({ success: false, error: "Invalid password" });

    // Create JWT token
    const adminToken = jwt.sign(
      { id: admin._id, isSuper: admin.isSuper },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send token as httpOnly cookie
    res
      .cookie("adminToken", adminToken, {
        httpOnly: true, // JS cannot access it
        secure: false, // use HTTPS in prod
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({
        success: true,
        username: admin.username,
        isSuper: admin.isSuper,
      });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
