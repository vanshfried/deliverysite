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

    paymentMethod: { type: String, enum: ["UPI", "COD"], required: true },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

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

    adminActionBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],

    timestampsLog: {
      createdAt: { type: Date, default: Date.now },
      acceptedAt: { type: Date },
      cancelledAt: { type: Date },
      outForDeliveryAt: { type: Date },
      deliveredAt: { type: Date },
    },

    // 👇 New slug field
    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
