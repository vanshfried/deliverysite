import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true, // For faster queries by store
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],

    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["UPI", "COD"], required: true },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    pickupOTP: {
      type: Number,
      default: null, // 4-digit OTP
    },

    pickupOTPExpires: {
      type: Date,
      default: null, // Expires after 5 minutes
    },

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

    status: {
      type: String,
      enum: [
        "PENDING",
        "CANCELLED",
        "PROCESSING",
        "DRIVER_ASSIGNED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ],
      default: "PENDING",
    },

    adminActionBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],

    timestampsLog: {
      acceptedAt: { type: Date, default: null },
      cancelledAt: { type: Date, default: null },
      driverAssignedAt: { type: Date, default: null },
      awaitingPickupAt: { type: Date, default: null },
      outForDeliveryAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
    },

    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true }
);

OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ store: 1, createdAt: -1 });

export default mongoose.model("Order", OrderSchema);
