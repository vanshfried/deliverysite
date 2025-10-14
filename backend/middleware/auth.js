// bckend/middleware/auth.js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export async function requireAdmin(req, res, next) {
  try {
    // 1️⃣ Check for token in cookies
    const token = req.cookies?.adminToken;
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized: No token provided" });
    }

    // 2️⃣ Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.id) {
      return res.status(401).json({ success: false, error: "Unauthorized: Invalid token" });
    }

    // 3️⃣ Find admin in DB
    const admin = await Admin.findById(payload.id).select("+passwordHash");
    if (!admin) {
      return res.status(401).json({ success: false, error: "Unauthorized: Admin not found" });
    }

    // 4️⃣ Attach admin object to request
    req.admin = admin;

    // ✅ Proceed to next middleware / route
    next();
  } catch (err) {
    console.error("requireAdmin middleware error:", err);
    return res.status(401).json({ success: false, error: "Unauthorized: Token verification failed" });
  }
}
