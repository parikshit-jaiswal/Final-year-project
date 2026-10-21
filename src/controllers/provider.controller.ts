import type { Request, Response } from "express";
import { Provider } from "../models/provider.js";
import { normalizePhone } from "../utils/otp.js";
import { providerRegistrationSchema } from "../utils/validation.js";

export async function registerProvider(req: Request, res: Response) {
  const data = providerRegistrationSchema.parse(req.body);
  const provider = await Provider.create({
    ...data,
    phone: normalizePhone(data.phone),
  });

  return res.status(201).json({
    success: true,
    message: "Registration submitted for verification",
    provider,
  });
}

export async function getProvider(req: Request, res: Response) {
  if (req.auth?.userType !== "provider" || req.auth.sub !== req.params.id) {
    return res.status(403).json({ success: false, message: "You cannot access this provider profile" });
  }
  const provider = await Provider.findById(req.params.id).select("-__v");
  if (!provider) {
    return res.status(404).json({ success: false, message: "Provider not found" });
  }
  return res.json({ success: true, provider });
}
