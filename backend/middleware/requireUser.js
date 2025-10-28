// backend/middleware/requireUser.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireUser(req, res, next) {
  try {
    const token = req.cookies?.userToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No login session",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // ✅ Token invalid/expired → clear cookie properly
      res.clearCookie("userToken", {
        httpOnly: true,
        secure: true,     // ✅ same as login
        sameSite: "none", // ✅ match cookie settings
      });

      return res.status(401).json({
        success: false,
        error: "Session expired, please log in again",
      });
    }

    if (!payload?.id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid token data",
      });
    }

    const user = await User.findById(payload.id).select("-otp -otpExpires");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("requireUser middleware error:", err);
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }
}
