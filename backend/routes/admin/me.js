// backend/routes/admin/me.js
import express from "express";
import { requireAdmin } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", requireAdmin, (req, res) => {
  const { _id, username, email, isSuper } = req.admin;
  res.json({ success: true, admin: { _id, username, email, isSuper } });
});

export default router;
