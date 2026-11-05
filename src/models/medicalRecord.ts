import { Schema, model } from "mongoose";

const medicalRecordSchema = new Schema(
  {
    worker: { type: Schema.Types.ObjectId, ref: "Worker", required: true, index: true },
    provider: { type: Schema.Types.ObjectId, ref: "Provider", required: true, index: true },
    condition: { type: String, required: true, trim: true, maxlength: 2000 },
    visitAt: { type: Date, required: true },
    prescriptionNotes: { type: String, trim: true, maxlength: 5000 },
    clinicalRemarks: { type: String, trim: true, maxlength: 5000 },
    observations: [{ type: String, trim: true, maxlength: 120 }],
    prescriptionImageUrl: { type: String, trim: true },
    prescriptionImagePublicId: { type: String, trim: true },
    workerPhoneVerified: { type: Boolean, default: false },
    verification: {
      photoUrl: { type: String, trim: true },
      photoPublicId: { type: String, trim: true },
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      accuracyMeters: { type: Number, min: 0 },
      capturedAt: { type: Date },
      address: { type: String, trim: true },
    },
    status: { type: String, enum: ["submitted", "reviewed", "flagged"], default: "submitted", index: true },
  },
  { timestamps: true },
);

medicalRecordSchema.index({ visitAt: -1 });
export const MedicalRecord = model("MedicalRecord", medicalRecordSchema);
