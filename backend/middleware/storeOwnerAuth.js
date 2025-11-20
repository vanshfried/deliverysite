import jwt from "jsonwebtoken";
import StoreOwner from "../models/StoreOwner.js";

export default async function storeOwnerAuth(req, res, next) {
  try {
    const token = req.cookies.storeOwnerToken;

    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const owner = await StoreOwner.findById(decoded.id);

    if (!owner) return res.status(401).json({ message: "Invalid token" });

    req.storeOwner = owner;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
