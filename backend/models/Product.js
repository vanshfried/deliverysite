import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPrice: {
    type: Number,
    default: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    
  },
  logo: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    validate: [arr => arr.length <= 4, "Maximum 4 images allowed"],
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  specs: {
    type: Map,
    of: String, // e.g., { "Color": "Red", "Weight": "1kg" }
  },
  tags: [String],
  videos: [String], // Optional
}, { timestamps: true });

productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ tags: 1 });

export default mongoose.model("Product", productSchema);
