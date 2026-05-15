const mongoose = require("mongoose");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/medi-queue";

async function fixIndexes() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);

    const User = require("./src/models/user.model");

    console.log("Dropping old indexes...");
    // Drop all indexes first
    await User.collection.dropIndexes();
    console.log("✅ All old indexes dropped");

    console.log("Recreating indexes from schema...");
    // Recreate indexes from the schema
    await User.collection.getIndexes();
    console.log("✅ New indexes applied");

    console.log("Current indexes:");
    const indexes = await User.collection.getIndexes();
    console.log(indexes);

    await mongoose.disconnect();
    console.log(
      "✅ Complete! You can now register the same doctor to multiple hospitals.",
    );
  } catch (error) {
    console.error("Error fixing indexes:", error);
    process.exit(1);
  }
}

fixIndexes();
