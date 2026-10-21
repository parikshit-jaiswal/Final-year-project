import { Schema, model } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userType: { type: String, enum: ["provider", "worker"], required: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    replacedByTokenHash: { type: String },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model("RefreshToken", refreshTokenSchema);
