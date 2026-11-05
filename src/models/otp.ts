import { Schema, model } from "mongoose";

export interface OtpDocument {
  phone: string;
  role: "provider" | "worker";
  codeHash: string;
  expiresAt: Date;
  attempts?: number;
  consumedAt?: Date;
}

const otpSchema = new Schema<OtpDocument>(
  {
    phone: { type: String, required: true, index: true },
    role: { type: String, enum: ["provider", "worker"], required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model("Otp", otpSchema);
