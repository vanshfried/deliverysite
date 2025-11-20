import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "StoreOwner", required: true },

  storeName: { type: String, required: true },
  storeImage: { type: String }, // optional
  address: { type: String },

  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Store", StoreSchema);
