import { Schema, model } from "mongoose";

const workerSchema = new Schema(
  {
    workerId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    yearOfBirth: { type: Number, required: true, min: 1900, max: 2100 },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    industry: { type: String, required: true, trim: true },
    homeState: { type: String, required: true, trim: true },
    homeDistrict: { type: String, required: true, trim: true },
    workDestination: { type: String, required: true, trim: true },
    consent: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ["active", "pending_verification"],
      default: "pending_verification",
    },
  },
  { timestamps: true },
);

export const Worker = model("Worker", workerSchema);
