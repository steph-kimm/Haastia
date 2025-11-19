import {} from "dotenv/config";
import mongoose from "mongoose";
import Service from "../models/service.js";

const run = async () => {
  const uri = process.env.DATABASE;
  if (!uri) {
    console.error("DATABASE env var is required to run this migration");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to database");

  const result = await Service.updateMany(
    { allowFreeReservations: { $exists: false } },
    { $set: { allowFreeReservations: false } }
  );

  console.log(`Updated ${result.modifiedCount} service documents.`);
  await mongoose.disconnect();
  console.log("Disconnected");
};

run().catch((err) => {
  console.error("Migration failed", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
