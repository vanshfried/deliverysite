//backend/routes/admin/logout.js
import express from "express";
const router = express.Router();

router.post("/", (req, res) => {
  res
    .clearCookie("adminToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .json({ success: true, message: "Logged out" });
});

export default router;
