import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  priceAtAddTime: {
    type: Number, // price when added to cart (so changes in Product price won't affect existing items)
    required: true,
  },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // one cart per user
  },
  items: {
    type: [cartItemSchema],
    default: [],
  },
  totalItems: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true, // if false, cart is checked out / archived
  },
}, { timestamps: true });

// Automatically calculate totals before saving
cartSchema.pre("save", function (next) {
  this.totalItems = this.items.reduce((sum, i) => sum + i.quantity, 0);
  this.totalPrice = this.items.reduce((sum, i) => sum + (i.priceAtAddTime * i.quantity), 0);
  next();
});

export default mongoose.model("Cart", cartSchema);
