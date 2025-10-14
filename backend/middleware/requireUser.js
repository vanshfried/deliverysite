// backend/middleware/requireUser.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireUser(req, res, next) {
  try {
    // 1️⃣ Get token from cookies
    const token = req.cookies?.userToken;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token" });
    }

    // 2️⃣ Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.id) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    // 3️⃣ Find user in DB
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 4️⃣ Attach user to request
    req.user = user;

    // ✅ Proceed
    next();
  } catch (err) {
    console.error("requireUser middleware error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}
