import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StoreOwner",
    required: true,
  },

  storeName: { type: String, required: true },

  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },

  storeImage: { type: String },

  address: { type: String }, // readable address for display

  // ✅ NEW: MAP LOCATION
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    accuracy: { type: Number },
  },

  description: { type: String },
  phone: { type: String },

  openingTime: { type: String },
  closingTime: { type: String },

  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
});

/* ------------------------------------------
   AUTO-GENERATE SLUG WHEN NAME CHANGES
------------------------------------------- */
StoreSchema.pre("save", function (next) {
  if (this.isModified("storeName")) {
    this.slug = this.storeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

export default mongoose.model("Store", StoreSchema);
