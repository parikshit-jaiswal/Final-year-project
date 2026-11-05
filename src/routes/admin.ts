import { Router } from "express";
import { authenticateAccessToken } from "../middleware/auth.middleware.js";
import { dashboard, hotspots, listCheckins, listProviders, listReports, listWorkers, loginAdmin, updateProviderStatus } from "../controllers/admin.controller.js";

const router = Router();
router.post("/auth/login", loginAdmin);
router.use(authenticateAccessToken);
router.use((req, res, next) => req.auth?.userType === "admin" ? next() : res.status(403).json({ success: false, message: "Administrator access is required" }));
router.get("/dashboard", dashboard);
router.get("/workers", listWorkers);
router.get("/providers", listProviders);
router.patch("/providers/:id/status", updateProviderStatus);
router.get("/checkins", listCheckins);
router.get("/reports", listReports);
router.get("/hotspots", hotspots);
router.get("/settings", (_req, res) => res.json({ success: true, settings: { otpExpirySeconds: 300, retentionDays: 2555, geofenceRadiusMeters: 150 } }));

export default router;
