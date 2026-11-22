import { model, Schema } from "mongoose";

const settingsSchema = new Schema(
  {
    otpExpirySeconds: { type: Number, required: true, default: 300, min: 60, max: 3600 },
    retentionDays: { type: Number, required: true, default: 2555, min: 1, max: 36500 },
    geofenceRadiusMeters: { type: Number, required: true, default: 150, min: 10, max: 10000 },
  },
  { timestamps: true },
);

export const Settings = model("Settings", settingsSchema);
