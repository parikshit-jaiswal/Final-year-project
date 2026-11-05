import { Router } from "express";
import authRoutes from "./auth.js";
import providerRoutes from "./providers.js";
import testRoutes from "./test.js";
import workerRoutes from "./workers.js";
import medicalRoutes from "./medical.js";
import adminRoutes from "./admin.js";

const router = Router();

router.use("/", testRoutes);
router.use("/", authRoutes);
router.use("/providers", providerRoutes);
router.use("/workers", workerRoutes);
router.use("/medical-records", medicalRoutes);
router.use("/admin", adminRoutes);

export default router;