import mongoose from "mongoose";

const StoreOwnerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },

  storeName: { type: String, required: true },

  passwordHash: { type: String, required: true }, // bcrypt
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("StoreOwner", StoreOwnerSchema);
