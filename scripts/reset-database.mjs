import "dotenv/config";
import mongoose from "mongoose";

const expectedDatabaseName = "caretrail";
const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is not configured.");
}

const configuredDatabaseName = new URL(uri).pathname.replace(/^\/+/, "");
if (configuredDatabaseName !== expectedDatabaseName) {
  throw new Error(
    `Refusing to reset database "${configuredDatabaseName || "<default>"}". Expected "${expectedDatabaseName}".`,
  );
}

try {
  await mongoose.connect(uri);

  const database = mongoose.connection.db;
  if (!database) {
    throw new Error("MongoDB connection did not expose a database handle.");
  }

  await database.dropDatabase();
  const remainingCollections = await database.listCollections().toArray();

  if (remainingCollections.length > 0) {
    throw new Error(
      `Database reset was incomplete: ${remainingCollections.length} collection(s) remain.`,
    );
  }

  console.log(`Database "${expectedDatabaseName}" reset successfully.`);
} finally {
  await mongoose.disconnect();
}
