import { Schema, model } from "mongoose";

const providerSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["district_hospital", "phc", "mobile_camp", "ngo_camp"],
      required: true,
    },
    fullName: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    facilityId: { type: String, required: true, trim: true },
    facilityProofUrl: { type: String, trim: true },
    condition: { type: String, trim: true },
    conditionDateTime: { type: Date },
    conditionStartDateTime: { type: Date },
    conditionEndDateTime: { type: Date },
    conditionPhotoUrl: { type: String, trim: true },
    conditionPhotoPublicId: { type: String, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending_verification", "active", "rejected"],
      default: "pending_verification",
    },
    consent: { type: Boolean, required: true },
  },
  { timestamps: true },
);

export const Provider = model("Provider", providerSchema);
