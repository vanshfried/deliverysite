//backend/routes/store/storeownerauth.js
import express from "express";
import bcrypt from "bcrypt";
import StoreOwner from "../../models/StoreOwner.js";
import { setTokenCookie } from "../../utils/setStoreTokenCookie.js";
import storeOwnerAuth from "../../middleware/storeOwnerAuth.js";
const router = express.Router();

// ----------------------------
// Store Owner Signup
// ----------------------------
router.post("/signup", async (req, res) => {
  try {
    const { fullName, phone, storeName, password } = req.body;

    if (!fullName || !phone || !storeName || !password)
      return res.status(400).json({ message: "Missing fields" });

    // phone must be unique
    const exists = await StoreOwner.findOne({ phone });
    if (exists)
      return res.status(409).json({ message: "Phone already registered" });

    const passwordHash = await bcrypt.hash(password, 10);

    const newOwner = await StoreOwner.create({
      fullName,
      phone,
      storeName,
      passwordHash,
      status: "pending", // awaiting admin approval
    });

    res.json({
      message: "Signup request submitted. Await admin approval.",
      ownerId: newOwner._id,
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ----------------------------
// Store Owner Login
// ----------------------------
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const owner = await StoreOwner.findOne({ phone });
    if (!owner)
      return res.status(401).json({ message: "Invalid credentials" });

    // Only approved users can login
    if (owner.status !== "approved")
      return res.status(403).json({
        message:
          owner.status === "pending"
            ? "Waiting for approval"
            : "Your request was rejected",
      });

    const match = await bcrypt.compare(password, owner.passwordHash);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    // Set cookie
    setTokenCookie(res, { id: owner._id, role: "storeOwner" });

    res.json({
      message: "Login successful",
      owner: {
        id: owner._id,
        fullName: owner.fullName,
        storeName: owner.storeName,
        phone: owner.phone,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ----------------------------
// Logout
// ----------------------------
router.post("/logout", (req, res) => {
  res.clearCookie("storeOwnerToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.json({ message: "Logged out" });
});

// Store Owner Me
router.get("/me", storeOwnerAuth, (req, res) => {
  const owner = req.storeOwner;

  res.json({
    owner: {
      id: owner._id,
      fullName: owner.fullName,
      storeName: owner.storeName,
      phone: owner.phone,
      status: owner.status,
    },
  });
});

export default router;
