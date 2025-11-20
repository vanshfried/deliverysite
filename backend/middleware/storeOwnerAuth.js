// backend\middleware\storeOwnerAuth.js
import jwt from "jsonwebtoken";
import StoreOwner from "../models/StoreOwner.js";
import Store from "../models/Store.js";

export default async function storeOwnerAuth(req, res, next) {
  try {
    const token = req.cookies.storeOwnerToken;

    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const owner = await StoreOwner.findById(decoded.id);
    if (!owner) return res.status(401).json({ message: "Invalid token" });

    req.storeOwner = owner;

    // -----------------------------
    // Attach store instance as well
    // -----------------------------
    const store = await Store.findOne({ ownerId: owner._id });
    req.store = store; // May be null (if not created yet)

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
