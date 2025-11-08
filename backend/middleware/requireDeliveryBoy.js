import jwt from "jsonwebtoken";
import DeliveryBoy from "../models/DeliveryBoy.js";

export async function requireDeliveryBoy(req, res, next) {
  try {
    const token = req.cookies?.deliveryToken;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: No login session" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      res.clearCookie("deliveryToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      return res
        .status(401)
        .json({
          success: false,
          error: "Session expired, please log in again",
        });
    }

    if (!payload?.id) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: Invalid token data" });
    }

    const deliveryBoy = await DeliveryBoy.findById(payload.id).select(
      "-passwordHash"
    );
    if (!deliveryBoy) {
      return res
        .status(404)
        .json({ success: false, error: "Delivery partner not found" });
    }

    if (!deliveryBoy.isApproved) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Your account is awaiting admin approval",
        });
    }

    if (!deliveryBoy.isActive) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Your account has been deactivated by admin",
        });
    }

    req.user = deliveryBoy;
    req.deliveryBoyId = deliveryBoy._id; // optional shortcut
    next();
  } catch (err) {
    console.error("❌ requireDeliveryBoy middleware error:", err);
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
}
