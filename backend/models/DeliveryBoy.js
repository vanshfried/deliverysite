import mongoose from "mongoose";

const DeliveryBoySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }, // bcrypt hashed password

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  },

  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: "India" },
  },

  serviceArea: {
    city: { type: String },
    pincodes: [{ type: String }],
  },

  stats: {
    accepted: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    ignored: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },

  // ✅ New field to track rejected orders
  rejectedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-update updatedAt timestamp
DeliveryBoySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("DeliveryBoy", DeliveryBoySchema);

