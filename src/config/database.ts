import mongoose from "mongoose";
import { Admin } from "../models/admin.js";
import { hashPassword } from "../utils/password.js";

export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/caretrail";

  await mongoose.connect(uri);
  console.log("MongoDB connected");
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password && password.length >= 8) {
    await Admin.updateOne(
      { email: email.toLowerCase() },
      { $setOnInsert: { email: email.toLowerCase(), fullName: process.env.ADMIN_NAME ?? "Administrator", passwordHash: hashPassword(password), role: "super_admin" } },
      { upsert: true },
    );
  }
}