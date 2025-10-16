// backend/models/Tag.js
import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true, // every tag must belong to a category
    },
  },
  { timestamps: true }
);

// Unique tag per category
tagSchema.index({ name: 1, category: 1 }, { unique: true });

export default mongoose.model("Tag", tagSchema);
