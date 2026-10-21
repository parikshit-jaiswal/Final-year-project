import { createHash, randomBytes } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { RefreshToken } from "../models/refreshToken.js";

export type UserType = "provider" | "worker";

export interface AccessTokenClaims extends JwtPayload {
  sub: string;
  userType: UserType;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenClaims;
    }
  }
}

function jwtSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be configured with at least 32 characters");
  }
  return secret;
}

function accessTokenTtl(): number {
  return Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900);
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createAccessToken(userId: string, userType: UserType): string {
  return jwt.sign({ userType }, jwtSecret(), {
    subject: userId,
    expiresIn: accessTokenTtl(),
  });
}

export async function createRefreshToken(
  userId: string,
  userType: UserType,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(48).toString("base64url");
  const expiresAt = new Date(
    Date.now() + Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30) * 24 * 60 * 60 * 1000,
  );

  await RefreshToken.create({
    tokenHash: hashRefreshToken(token),
    userId,
    userType,
    expiresAt,
  });
  return { token, expiresAt };
}

export async function issueTokens(userId: string, userType: UserType) {
  const refresh = await createRefreshToken(userId, userType);
  return {
    accessToken: createAccessToken(userId, userType),
    refreshToken: refresh.token,
    accessTokenExpiresIn: accessTokenTtl(),
    refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
  };
}

export function authenticateAccessToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access token is required" });
  }

  try {
    const claims = jwt.verify(header.slice(7), jwtSecret());
    if (
      typeof claims === "string" ||
      typeof claims.sub !== "string" ||
      (claims.userType !== "provider" && claims.userType !== "worker")
    ) {
      throw new Error("Invalid access token claims");
    }
    req.auth = claims as AccessTokenClaims;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired access token" });
  }
}
