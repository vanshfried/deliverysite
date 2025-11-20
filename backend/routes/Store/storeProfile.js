// backend/routes/store/storeProfile.js
import express from "express";
import storeOwnerAuth from "../../middleware/storeOwnerAuth.js";
import Store from "../../models/Store.js";
import multer from "multer";

const router = express.Router();

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Update store profile
router.put(
  "/update",
  storeOwnerAuth,
  upload.single("storeImage"),
  async (req, res) => {
    try {
      const ownerId = req.storeOwner._id;

      const {
        storeName,
        address,
        description,
        openingTime,
        closingTime,
        phone,
      } = req.body;

      const updateData = {
        storeName,
        address,
        description,
        openingTime,
        closingTime,
        phone,
      };

      // If image uploaded → convert to base64
      if (req.file) {
        updateData.storeImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }

      const store = await Store.findOneAndUpdate(
        { ownerId },
        updateData,
        { new: true }
      );

      return res.json({
        success: true,
        message: "Store updated",
        store,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
