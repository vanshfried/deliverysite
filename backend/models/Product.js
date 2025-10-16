// backend/models/Product.js
import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
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
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      validate: [(arr) => arr.length <= 4, "Maximum 4 images allowed"],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    specs: {
      type: Map,
      of: String,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    videos: [String],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ---------------- Slug Middleware ----------------
productSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// ---------------- Virtuals ----------------
productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

productSchema.virtual("category", {
  ref: "Category",
  localField: "subCategory",
  foreignField: "_id",
  justOne: true,
  options: { strictPopulate: false },
});

// ---------------- Indexes ----------------
productSchema.index({ name: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ tags: 1 });

export default mongoose.model("Product", productSchema);
