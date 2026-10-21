import { randomInt } from "node:crypto";
import type { Request, Response } from "express";
import { Worker } from "../models/worker.js";
import { issueTokens } from "../utils/auth.js";
import { normalizePhone } from "../utils/otp.js";
import { workerLoginSchema, workerRegistrationSchema } from "../utils/validation.js";

async function createWorkerId(): Promise<string> {
  for (;;) {
    const workerId = `CTH${randomInt(10000000, 100000000)}`;
    if (!(await Worker.exists({ workerId }))) return workerId;
  }
}

export async function registerWorker(req: Request, res: Response) {
  const data = workerRegistrationSchema.parse(req.body);
  const worker = await Worker.create({
    ...data,
    workerId: await createWorkerId(),
    phone: normalizePhone(data.phone),
    status: "active",
  });

  return res.status(201).json({
    success: true,
    message: "Worker health ID generated successfully",
    worker,
  });
}

export async function loginWorker(req: Request, res: Response) {
  const { workerId } = workerLoginSchema.parse(req.body);
  const worker = await Worker.findOne({ workerId: workerId.toUpperCase() }).select("-__v");

  if (!worker) {
    return res.status(404).json({ success: false, message: "Worker ID not found" });
  }

  return res.json({
    success: true,
    message: "Login successful",
    worker,
    tokens: await issueTokens(worker.id, "worker"),
  });
}

export async function getWorker(req: Request, res: Response) {
  if (req.auth?.userType !== "worker") {
    return res.status(403).json({ success: false, message: "You cannot access this worker profile" });
  }
  const workerId = Array.isArray(req.params.workerId)
    ? req.params.workerId[0]
    : req.params.workerId;
  const worker = await Worker.findOne({
    workerId: workerId.toUpperCase(),
  }).select("-__v");
  if (!worker) {
    return res.status(404).json({ success: false, message: "Worker not found" });
  }
  if (req.auth.sub !== worker.id) {
    return res.status(403).json({ success: false, message: "You cannot access this worker profile" });
  }
  return res.json({ success: true, worker });
}
