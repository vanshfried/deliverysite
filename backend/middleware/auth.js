// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.adminToken;
    if (!token) return res.status(401).json({ success: false, error: "Unauthorized: No token provided" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.id) return res.status(401).json({ success: false, error: "Unauthorized: Invalid token" });

    const admin = await Admin.findById(payload.id).select("+passwordHash");
    if (!admin) return res.status(401).json({ success: false, error: "Unauthorized: Admin not found" });

    req.admin = admin;
    next();
  } catch (err) {
    console.error("requireAdmin middleware error:", err);
    return res.status(401).json({ success: false, error: "Unauthorized: Token verification failed" });
  }
}

// ✅ Superadmin middleware
export const requireSuperAdmin = [
  requireAdmin,
  (req, res, next) => {
    if (!req.admin.isSuper) return res.status(403).json({ error: "Only superadmin can access this" });
    next();
  }
];
