// backend/models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 });

export default mongoose.model("Category", categorySchema);
