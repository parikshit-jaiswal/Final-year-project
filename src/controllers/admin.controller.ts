import type { Request, Response } from "express";
import { MedicalRecord } from "../models/medicalRecord.js";
import { Provider } from "../models/provider.js";
import { Worker } from "../models/worker.js";
import { Admin } from "../models/admin.js";
import { issueTokens } from "../utils/auth.js";
import { verifyPassword } from "../utils/password.js";
import { adminLoginSchema, providerStatusSchema } from "../utils/validation.js";

export async function loginAdmin(req: Request, res: Response) {
  const { email, password } = adminLoginSchema.parse(req.body);
  const admin = await Admin.findOne({ email: email.toLowerCase(), status: "active" });
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return res.status(401).json({ success: false, message: "Invalid administrator credentials" });
  }
  return res.json({ success: true, admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role }, tokens: await issueTokens(admin.id, "admin") });
}

export async function dashboard(_req: Request, res: Response) {
  const [workers, providers, records, pendingProviders, flaggedRecords] = await Promise.all([
    Worker.countDocuments(),
    Provider.countDocuments({ status: "active" }),
    MedicalRecord.countDocuments(),
    Provider.countDocuments({ status: "pending_verification" }),
    MedicalRecord.countDocuments({ status: "flagged" }),
  ]);
  return res.json({ success: true, metrics: { activeWorkers: workers, activeProviders: providers, records, pendingProviders, flaggedRecords } });
}

export async function listWorkers(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === "string") filter.status = req.query.status;
  if (typeof req.query.search === "string" && req.query.search.trim()) {
    const expression = new RegExp(req.query.search.trim(), "i");
    filter.$or = [{ fullName: expression }, { workerId: expression }, { homeDistrict: expression }, { workDestination: expression }];
  }
  const workers = await Worker.find(filter).sort({ createdAt: -1 }).limit(100);
  return res.json({ success: true, workers });
}

export async function listProviders(_req: Request, res: Response) {
  const providers = await Provider.find().sort({ createdAt: -1 }).limit(100);
  return res.json({ success: true, providers });
}

export async function updateProviderStatus(req: Request, res: Response) {
  const { status } = providerStatusSchema.parse(req.body);
  const provider = await Provider.findByIdAndUpdate(req.params.id, { status }, { new: true }).select("-__v");
  if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });
  return res.json({ success: true, provider });
}

export async function listCheckins(_req: Request, res: Response) {
  const records = await MedicalRecord.find().populate("worker", "workerId fullName").populate("provider", "fullName facilityId").sort({ visitAt: -1 }).limit(100);
  return res.json({ success: true, checkins: records });
}

export async function listReports(_req: Request, res: Response) {
  const reports = await MedicalRecord.find().populate("worker", "workerId fullName").populate("provider", "fullName").sort({ createdAt: -1 }).limit(100);
  return res.json({ success: true, reports });
}

export async function hotspots(_req: Request, res: Response) {
  const hotspots = await MedicalRecord.aggregate([
    { $match: { "verification.latitude": { $exists: true }, "verification.longitude": { $exists: true } } },
    { $group: { _id: { latitude: "$verification.latitude", longitude: "$verification.longitude" }, visits: { $sum: 1 } } },
    { $sort: { visits: -1 } },
    { $limit: 100 },
  ]);
  return res.json({ success: true, hotspots });
}
