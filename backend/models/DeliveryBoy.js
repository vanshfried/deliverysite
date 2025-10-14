import mongoose from "mongoose";

const DeliveryBoySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }, // bcrypt hashed password

  stats: {
    accepted: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    ignored: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },

  // track who created this delivery boy (admin)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

  // optional status toggle (useful if you ever disable a delivery boy)
  isActive: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// automatically update updatedAt when modified
DeliveryBoySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("DeliveryBoy", DeliveryBoySchema);
