import type { Request, Response } from "express";
import { MedicalRecord } from "../models/medicalRecord.js";
import { Provider } from "../models/provider.js";
import { Worker } from "../models/worker.js";
import { Admin } from "../models/admin.js";
import { issueTokens } from "../utils/auth.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { Settings } from "../models/settings.js";
import { administratorSchema, adminLoginSchema, providerStatusSchema, settingsUpdateSchema } from "../utils/validation.js";

export async function loginAdmin(req: Request, res: Response) {
  const { email, password } = adminLoginSchema.parse(req.body);
  const admin = await Admin.findOne({ email: email.toLowerCase(), status: "active" });
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return res.status(401).json({ success: false, message: "Invalid administrator credentials" });
  }
  return res.json({ success: true, admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role }, tokens: await issueTokens(admin.id, "admin") });
}

export async function dashboard(_req: Request, res: Response) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [workers, providers, records, pendingProviders, flaggedRecords, checkinsToday, monitoredSites] = await Promise.all([
    Worker.countDocuments(),
    Provider.countDocuments({ status: "active" }),
    MedicalRecord.countDocuments(),
    Provider.countDocuments({ status: "pending_verification" }),
    MedicalRecord.countDocuments({ status: "flagged" }),
    MedicalRecord.countDocuments({ visitAt: { $gte: today } }),
    MedicalRecord.distinct("verification.address", { "verification.address": { $exists: true, $nin: ["", null] } }),
  ]);
  return res.json({
    success: true,
    metrics: {
      activeWorkers: workers,
      activeProviders: providers,
      activeCheckinsToday: checkinsToday,
      monitoredWorkSites: monitoredSites.length,
      records,
      pendingProviders,
      flaggedRecords,
    },
  });
}

export async function listWorkers(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === "string") filter.status = req.query.status;
  if (typeof req.query.district === "string" && req.query.district.trim()) {
    filter.homeDistrict = new RegExp(req.query.district.trim(), "i");
  }
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

export async function listCheckins(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.from === "string" && req.query.from) {
    const from = new Date(req.query.from);
    if (!Number.isNaN(from.getTime())) filter.visitAt = { $gte: from };
  }
  if (typeof req.query.to === "string" && req.query.to) {
    const to = new Date(req.query.to);
    if (!Number.isNaN(to.getTime())) {
      filter.visitAt = { ...(filter.visitAt as object ?? {}), $lte: to };
    }
  }
  if (typeof req.query.status === "string") filter.status = req.query.status;
  const records = await MedicalRecord.find(filter).populate("worker", "workerId fullName phone").populate("provider", "fullName facilityId").sort({ visitAt: -1 }).limit(100);
  return res.json({ success: true, checkins: records });
}

export async function listReports(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.condition === "string" && req.query.condition.trim()) {
    filter.condition = new RegExp(req.query.condition.trim(), "i");
  }
  if (typeof req.query.status === "string") filter.status = req.query.status;
  if (typeof req.query.from === "string" && req.query.from) {
    const from = new Date(req.query.from);
    if (!Number.isNaN(from.getTime())) filter.visitAt = { $gte: from };
  }
  if (typeof req.query.to === "string" && req.query.to) {
    const to = new Date(req.query.to);
    if (!Number.isNaN(to.getTime())) {
      filter.visitAt = { ...(filter.visitAt as object ?? {}), $lte: to };
    }
  }
  const reports = await MedicalRecord.find(filter).populate("worker", "workerId fullName phone").populate("provider", "fullName facilityId").sort({ createdAt: -1 }).limit(100);
  return res.json({ success: true, reports });
}

export async function hotspots(req: Request, res: Response) {
  const match: Record<string, unknown> = {
    "verification.latitude": { $exists: true },
    "verification.longitude": { $exists: true },
  };
  if (typeof req.query.from === "string" && req.query.from) {
    const from = new Date(req.query.from);
    if (!Number.isNaN(from.getTime())) match.visitAt = { $gte: from };
  }
  const hotspots = await MedicalRecord.aggregate([
    { $match: match },
    { $group: { _id: { latitude: "$verification.latitude", longitude: "$verification.longitude" }, visits: { $sum: 1 } } },
    { $sort: { visits: -1 } },
    { $limit: 100 },
    { $project: { _id: 0, latitude: "$_id.latitude", longitude: "$_id.longitude", visits: 1 } },
  ]);
  return res.json({ success: true, hotspots });
}

export async function getSettings(_req: Request, res: Response) {
  const settings = await Settings.findOne().sort({ createdAt: 1 });
  return res.json({
    success: true,
    settings: settings
      ? { otpExpirySeconds: settings.otpExpirySeconds, retentionDays: settings.retentionDays, geofenceRadiusMeters: settings.geofenceRadiusMeters }
      : { otpExpirySeconds: 300, retentionDays: 2555, geofenceRadiusMeters: 150 },
  });
}

export async function updateSettings(req: Request, res: Response) {
  const changes = settingsUpdateSchema.parse(req.body);
  const settings = await Settings.findOneAndUpdate({}, { $set: changes }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return res.json({
    success: true,
    settings: { otpExpirySeconds: settings.otpExpirySeconds, retentionDays: settings.retentionDays, geofenceRadiusMeters: settings.geofenceRadiusMeters },
  });
}

export async function listAdministrators(_req: Request, res: Response) {
  const administrators = await Admin.find().select("-passwordHash").sort({ createdAt: -1 }).limit(100);
  return res.json({ success: true, administrators });
}

export async function createAdministrator(req: Request, res: Response) {
  const input = administratorSchema.parse(req.body);
  if (!input.password) return res.status(400).json({ success: false, message: "Password is required" });
  const administrator = await Admin.create({
    email: input.email.toLowerCase(),
    fullName: input.fullName,
    passwordHash: hashPassword(input.password),
    role: input.role ?? "admin",
    status: input.status ?? "active",
  });
  return res.status(201).json({
    success: true,
    administrator: { id: administrator.id, email: administrator.email, fullName: administrator.fullName, role: administrator.role, status: administrator.status },
  });
}

export async function updateAdministrator(req: Request, res: Response) {
  const input = administratorSchema.partial().parse(req.body);
  const changes: Record<string, unknown> = {};
  if (input.fullName) changes.fullName = input.fullName;
  if (input.email) changes.email = input.email.toLowerCase();
  if (input.role) changes.role = input.role;
  if (input.status) changes.status = input.status;
  if (input.password) changes.passwordHash = hashPassword(input.password);
  if (Object.keys(changes).length === 0) return res.status(400).json({ success: false, message: "At least one field is required" });
  const administrator = await Admin.findByIdAndUpdate(req.params.id, { $set: changes }, { new: true }).select("-passwordHash");
  if (!administrator) return res.status(404).json({ success: false, message: "Administrator not found" });
  return res.json({ success: true, administrator });
}

export async function deleteAdministrator(req: Request, res: Response) {
  if (req.auth?.sub === req.params.id) {
    return res.status(400).json({ success: false, message: "You cannot disable your own account" });
  }
  const administrator = await Admin.findByIdAndUpdate(req.params.id, { status: "disabled" }, { new: true }).select("-passwordHash");
  if (!administrator) return res.status(404).json({ success: false, message: "Administrator not found" });
  return res.json({ success: true, administrator });
}
