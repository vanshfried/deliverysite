import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },

    items: [
      {
        name: String,
        quantity: Number,
        price: Number,
      },
    ],

    totalAmount: { type: Number, required: true },

    // Payment
    paymentMethod: { type: String, enum: ["UPI", "COD"], required: true },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    // Delivery location (copied from user address)
    deliveryAddress: {
      houseNo: String,
      laneOrSector: String,
      landmark: String,
      pincode: String,
      coords: {
        lat: Number,
        lon: Number,
      },
    },

    // Order status lifecycle
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

    // Admin who accepted/cancelled (if any)
    adminActionBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    // Per-admin archive list
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],

    // Logs (for debugging later)
    timestampsLog: {
      createdAt: { type: Date, default: Date.now },
      acceptedAt: { type: Date },
      cancelledAt: { type: Date },
      outForDeliveryAt: { type: Date },
      deliveredAt: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
