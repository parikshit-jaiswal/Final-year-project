import type { Request, Response } from "express";
import { uploadConditionPhoto } from "../config/cloudinary.js";
import { Provider } from "../models/provider.js";
import { normalizePhone } from "../utils/otp.js";
import {
  providerRegistrationSchema,
  providerUpdateSchema,
} from "../utils/validation.js";

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

export async function updateProvider(req: Request, res: Response) {
  if (req.auth?.userType !== "provider" || req.auth.sub !== req.params.id) {
    return res.status(403).json({ success: false, message: "You cannot update this provider profile" });
  }

  const data = providerUpdateSchema.parse(req.body);
  const uploadedPhoto = req.file
    ? await uploadConditionPhoto(req.file.buffer, req.file.originalname)
    : undefined;
  const provider = await Provider.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        ...data,
        ...(uploadedPhoto
          ? {
              conditionPhotoUrl: uploadedPhoto.secureUrl,
              conditionPhotoPublicId: uploadedPhoto.publicId,
            }
          : {}),
      },
    },
    { new: true, runValidators: true },
  ).select("-__v");

  if (!provider) {
    return res.status(404).json({ success: false, message: "Provider not found" });
  }

  return res.json({
    success: true,
    message: "Provider profile updated successfully",
    provider,
  });
}
