import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import type { AccessTokenClaims } from "../utils/auth.js";

function jwtSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be configured with at least 32 characters");
  }
  return secret;
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
      !["provider", "worker", "admin"].includes(claims.userType as string)
    ) {
      throw new Error("Invalid access token claims");
    }
    req.auth = claims as AccessTokenClaims;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired access token" });
  }
}
