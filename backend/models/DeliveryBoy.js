import mongoose from "mongoose";

const DeliveryBoySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true }, // bcrypt hashed password

  // 🚦 Admin approval & status control
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // 📍 Current assigned order (only one active delivery allowed)
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  },
  // personal address
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: {type:String, default: "India" },
  },
  // 🌐 Optional service area (future expansion)
  serviceArea: {
    city: { type: String },
    pincodes: [{ type: String }],
  },

  // 📊 Performance stats
  stats: {
    accepted: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    ignored: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },

  // 🧑‍💼 Admin who created/approved
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// 🔄 Auto-update "updatedAt" timestamp
DeliveryBoySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("DeliveryBoy", DeliveryBoySchema);
