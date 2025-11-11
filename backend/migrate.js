import mongoose from "mongoose";
import DeliveryBoy from "./models/DeliveryBoy.js"; // your new model
import dotenv from "dotenv";
dotenv.config();
const MONGO_URI = process.env.MONGO_URI; // change this

const migrateLocations = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB ✅");

    const deliveryBoys = await DeliveryBoy.find();
    console.log(`Found ${deliveryBoys.length} delivery boys`);

    let updatedCount = 0;

    for (const boy of deliveryBoys) {
      // Skip if new location already set
      if (
        boy.location?.coordinates?.length === 2 &&
        (boy.location.coordinates[0] !== 0 || boy.location.coordinates[1] !== 0)
      ) {
        continue;
      }

      // Check if old currentLocation exists
      if (boy.currentLocation?.coordinates?.length === 2) {
        const [lon, lat] = boy.currentLocation.coordinates;
        boy.location.coordinates = [lon, lat];
        boy.location.type = "Point";
        boy.markModified("location");
        boy.currentLocation = undefined; // remove old field
        await boy.save();
        updatedCount++;
        console.log(`Updated delivery boy: ${boy.name}`);
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} records.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
};

migrateLocations();
