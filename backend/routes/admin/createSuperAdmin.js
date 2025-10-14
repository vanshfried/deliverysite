import express from "express";
import bcrypt from "bcrypt";
import Admin from "../../models/Admin.js";

const router = express.Router();

// ONE-TIME setup route
router.post("/create-super-admin", async (req, res) => {
  try {
    const existingSuper = await Admin.findOne({ isSuper: true });
    if (existingSuper)
      return res
        .status(400)
        .json({ error: "Super admin already exists. Only one allowed." });

    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "Missing required fields" });

    const passwordHash = await bcrypt.hash(password, 10);

    const superAdmin = new Admin({
      username,
      email,
      passwordHash,
      isSuper: true,
    });

    await superAdmin.save();

    res.json({ success: true, message: "Super admin created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
