import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    // 👤 Linked user
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 🚴 Assigned delivery person (optional)
    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },

    // 📦 Order items
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],

    // 💰 Payment info
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["UPI", "COD"], required: true },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    // 📍 Delivery address snapshot
    deliveryAddress: {
      label: String,
      houseNo: String,
      laneOrSector: String,
      landmark: String,
      pincode: String,
      coords: {
        lat: Number,
        lon: Number,
      },
    },

    // 🚦 Order status tracking
    status: {
      type: String,
      enum: [
        "PENDING",
        "CANCELLED",
        "ACCEPTED",
        "PROCESSING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ],
      default: "PENDING",
    },

    // 🧠 Admin actions
    adminActionBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],

    // 🕓 Detailed status timestamps
    timestampsLog: {
      acceptedAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
      outForDeliveryAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
    },

    // 🆔 Order identifier (used for slugs like ORD12345)
    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true } // Auto adds createdAt, updatedAt
);

// ✅ Optional index for performance (admin order sorting/filtering)
OrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Order", OrderSchema);
