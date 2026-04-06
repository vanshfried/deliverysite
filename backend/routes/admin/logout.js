// backend/routes/admin/logout.js
import express from "express";
const router = express.Router();

router.post("/", (req, res) => {
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: true,     
    sameSite: "none", 
    path: "/",        
  });

  return res.json({
    success: true,
    message: "Logged out successfully"
  });
});

export default router;
