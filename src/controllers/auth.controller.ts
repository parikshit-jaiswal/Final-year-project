import type { Request, Response } from "express";
import { Otp } from "../models/otp.js";
import { Provider } from "../models/provider.js";
import { RefreshToken } from "../models/refreshToken.js";
import { Worker } from "../models/worker.js";
import { hashRefreshToken, issueTokens, type UserType } from "../utils/auth.js";
import {
  createOtp,
  hashOtp,
  isDevelopmentOtpEnabled,
  normalizePhone,
} from "../utils/otp.js";
import { otpRequestSchema, otpVerifySchema } from "../utils/validation.js";

async function requestOtp(req: Request, res: Response, role: UserType) {
  const { phone } = otpRequestSchema.parse(req.body);
  const normalizedPhone = normalizePhone(phone);
  const code = createOtp();

  await Otp.deleteMany({ phone: normalizedPhone, role: role as "provider" | "worker" });
  await Otp.create({
    phone: normalizedPhone,
    role: role as "provider" | "worker",
    codeHash: hashOtp(code),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return res.status(201).json({
    success: true,
    message: "OTP generated. It expires in 5 minutes.",
    expiresInSeconds: 300,
    ...(isDevelopmentOtpEnabled() ? { otp: code } : {}),
  });
}

async function verifyOtp(req: Request, res: Response, role: UserType) {
  const { phone, code } = otpVerifySchema.parse(req.body);
  const normalizedPhone = normalizePhone(phone);
  const otp = await Otp.findOne({
    phone: normalizedPhone,
    role: role as "provider" | "worker",
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otp || (otp.attempts ?? 0) >= 5 || otp.codeHash !== hashOtp(code)) {
    if (otp) {
      otp.attempts = (otp.attempts ?? 0) + 1;
      await otp.save();
    }
    return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
  }

  otp.consumedAt = new Date();
  await otp.save();

  if (role === "provider") {
    const provider = await Provider.findOne({ phone: normalizedPhone }).select("-__v");
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider is not registered" });
    }
    if (provider.status !== "active") {
      return res.status(403).json({ success: false, message: "Provider registration is awaiting administrator approval" });
    }
    return res.json({
      success: true,
      verified: true,
      provider,
      tokens: await issueTokens(provider.id, role),
    });
  }

  const worker = await Worker.findOne({ phone: normalizedPhone }).select("-__v");
  if (!worker) {
    return res.status(404).json({ success: false, message: "Worker is not registered" });
  }
  return res.json({
    success: true,
    verified: true,
    worker,
    tokens: await issueTokens(worker.id, role),
  });
}

export function requestProviderOtp(req: Request, res: Response) {
  return requestOtp(req, res, "provider");
}

export function requestWorkerOtp(req: Request, res: Response) {
  return requestOtp(req, res, "worker");
}

export function verifyProviderOtp(req: Request, res: Response) {
  return verifyOtp(req, res, "provider");
}

export function verifyWorkerOtp(req: Request, res: Response) {
  return verifyOtp(req, res, "worker");
}

export async function refreshAccessToken(req: Request, res: Response) {
  const token = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
  if (!token) {
    return res.status(400).json({ success: false, message: "Refresh token is required" });
  }

  const storedToken = await RefreshToken.findOne({
    tokenHash: hashRefreshToken(token),
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (!storedToken) {
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }

  const tokens = await issueTokens(storedToken.userId.toString(), storedToken.userType);
  storedToken.revokedAt = new Date();
  storedToken.replacedByTokenHash = hashRefreshToken(tokens.refreshToken);
  await storedToken.save();
  return res.json({ success: true, tokens });
}

export async function logout(req: Request, res: Response) {
  const token = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
  if (token) {
    await RefreshToken.updateOne(
      { tokenHash: hashRefreshToken(token), revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  }
  return res.json({ success: true, message: "Logged out successfully" });
}
