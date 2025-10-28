// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

// ✅ Middleware to verify admin authentication
export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.adminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Admin not logged in",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // ✅ If token expired → clear cookie properly
      res.clearCookie("adminToken", {
        httpOnly: true,
        secure: true, // ✅ Match login cookie
        sameSite: "none", // ✅ Match login cookie
        path: "/", // ✅ Ensure cookie removal works
      });

      return res.status(401).json({
        success: false,
        error: "Session expired. Please login again",
      });
    }

    const admin = await Admin.findById(payload.id).select("-passwordHash");
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Admin not found",
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("requireAdmin middleware error:", err);

    return res.status(401).json({
      success: false,
      error: "Unauthorized: Token verification failed",
    });
  }
}

// ✅ Middleware for Superadmin access only
export const requireSuperAdmin = [
  requireAdmin,
  (req, res, next) => {
    if (!req.admin.isSuper) {
      return res.status(403).json({
        success: false,
        error: "Access denied: Superadmin only",
      });
    }
    next();
  },
];
