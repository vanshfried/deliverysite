// backend/scripts/backfillSubCategorySlugs.js
import mongoose from "mongoose";
import SubCategory from "../models/SubCategory.js";
import slugify from "slugify";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI;

const backfillSubCategorySlugs = async () => {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

    const subs = await SubCategory.find({ slug: { $exists: false } });
    console.log(`Found ${subs.length} subcategories without slugs.`);

    for (const sc of subs) {
      sc.slug = slugify(sc.name, { lower: true, strict: true });
      await sc.save();
      console.log(`Backfilled slug for subcategory: ${sc.name} → ${sc.slug}`);
    }

    console.log("✅ Done backfilling subcategory slugs!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

backfillSubCategorySlugs();
