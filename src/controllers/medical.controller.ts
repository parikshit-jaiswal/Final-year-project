import type { Request, Response } from "express";
import { uploadMedicalImage } from "../config/cloudinary.js";
import { MedicalRecord } from "../models/medicalRecord.js";
import { Provider } from "../models/provider.js";
import { Worker } from "../models/worker.js";
import { medicalRecordSchema } from "../utils/validation.js";

export async function createMedicalRecord(req: Request, res: Response) {
  if (req.auth?.userType !== "provider") {
    return res.status(403).json({ success: false, message: "Only an approved provider can create records" });
  }
  const provider = await Provider.findById(req.auth.sub);
  if (!provider || provider.status !== "active") {
    return res.status(403).json({ success: false, message: "Provider approval is required" });
  }
  const data = medicalRecordSchema.parse(req.body);
  const worker = await Worker.findOne({ workerId: data.workerId.toUpperCase() });
  if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });
  const uploaded = req.file ? await uploadMedicalImage(req.file.buffer, req.file.originalname) : undefined;
  const record = await MedicalRecord.create({
    worker: worker.id,
    provider: provider.id,
    condition: data.condition,
    visitAt: data.visitAt,
    prescriptionNotes: data.prescriptionNotes,
    clinicalRemarks: data.clinicalRemarks,
    observations: data.observations,
    workerPhoneVerified: true,
    prescriptionImageUrl: uploaded?.secureUrl,
    prescriptionImagePublicId: uploaded?.publicId,
    verification: {
      photoUrl: req.body.verificationPhotoUrl,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracyMeters: data.accuracyMeters,
      capturedAt: data.capturedAt,
      address: data.address,
    },
  });
  return res.status(201).json({ success: true, message: "Medical visit recorded successfully", record });
}

export async function listWorkerRecords(req: Request, res: Response) {
  const worker = await Worker.findOne({ workerId: String(req.params.workerId).toUpperCase() });
  if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });
  if (req.auth?.userType === "worker" && req.auth.sub !== worker.id) {
    return res.status(403).json({ success: false, message: "You cannot access these records" });
  }
  const records = await MedicalRecord.find({ worker: worker.id })
    .populate("provider", "fullName designation facilityId district")
    .sort({ visitAt: -1 });
  return res.json({ success: true, worker, records });
}

export async function getMedicalRecord(req: Request, res: Response) {
  const record = await MedicalRecord.findById(req.params.id)
    .populate("worker", "workerId fullName")
    .populate("provider", "fullName designation facilityId");
  if (!record) return res.status(404).json({ success: false, message: "Medical record not found" });
  if (req.auth?.userType === "worker" && record.worker._id.toString() !== req.auth.sub) {
    return res.status(403).json({ success: false, message: "You cannot access this record" });
  }
  return res.json({ success: true, record });
}
