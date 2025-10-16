// backend/scripts/backfillProductSlugs.js
import mongoose from "mongoose";
import Product from "../models/Product.js";
import slugify from "slugify";
import dotenv from "dotenv";

dotenv.config(); // loads MONGO_URI from .env

const mongoURI = process.env.MONGO_URI;

const backfillSlugs = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const products = await Product.find({ slug: { $exists: false } });
    console.log(`Found ${products.length} products without slugs.`);

    for (const p of products) {
      p.slug = slugify(p.name, { lower: true, strict: true });
      await p.save();
      console.log(`Backfilled slug for product: ${p.name} → ${p.slug}`);
    }

    console.log("✅ Done backfilling product slugs!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

backfillSlugs();
