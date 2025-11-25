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
      unique: true,
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
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
    
    
    videos: [String],

    // ---------------- Reviews & Ratings ----------------
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    averageRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
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

// ---------------- Instance Method ----------------
productSchema.methods.calculateAverageRating = async function () {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.numReviews = 0;
  } else {
    this.numReviews = this.reviews.length;
    this.averageRating =
      this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
  }
  await this.save();
};

// ---------------- Indexes ----------------
productSchema.index({ name: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ tags: 1 });

export default mongoose.model("Product", productSchema);
