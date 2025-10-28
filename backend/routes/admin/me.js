// backend/routes/admin/me.js
import express from "express";
import { requireAdmin } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", requireAdmin, (req, res) => {
  try {
    const { _id, username, email, isSuper } = req.admin;

    return res.json({
      success: true,
      admin: {
        id: _id,
        username,
        email,
        isSuper,
      },
    });
  } catch (err) {
    console.error("Admin session check error:", err);

    // ✅ If something fails, clear stale cookie
    res.clearCookie("adminToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
});

export default router;
