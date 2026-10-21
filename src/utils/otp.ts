import { createHash, randomInt } from "node:crypto";

export function createOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function isDevelopmentOtpEnabled(): boolean {
  return process.env.RETURN_OTP_IN_RESPONSE === "true";
}
