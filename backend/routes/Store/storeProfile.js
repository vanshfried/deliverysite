// backend/routes/store/storeProfile.js
import express from "express";
import storeOwnerAuth from "../../middleware/storeOwnerAuth.js";
import Store from "../../models/Store.js";
import multer from "multer";

const router = express.Router();

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Update store profile + location
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

        // ✅ NEW: location will come from frontend
        location, // expected: { lat, lon, accuracy }
      } = req.body;

      const updateData = {
        storeName,
        address,
        description,
        openingTime,
        closingTime,
        phone,
      };

      // ✅ Validate & set location if provided
      if (location) {
        let parsedLocation = location;

        // If location is sent as string (FormData), parse it
        if (typeof location === "string") {
          parsedLocation = JSON.parse(location);
        }

        if (
          typeof parsedLocation.lat === "number" &&
          typeof parsedLocation.lon === "number"
        ) {
          updateData.location = {
            lat: parsedLocation.lat,
            lon: parsedLocation.lon,
            accuracy: parsedLocation.accuracy || null,
          };
        } else {
          return res
            .status(400)
            .json({ message: "Invalid store location format" });
        }
      }

      // ✅ If image uploaded → convert to base64
      if (req.file) {
        updateData.storeImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
          "base64"
        )}`;
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
