import { Router } from "express";
import multer from "multer";
import { authenticateAccessToken } from "../middleware/auth.middleware.js";
import { createMedicalRecord, getMedicalRecord, listWorkerRecords } from "../controllers/medical.controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith("image/")),
});

router.post("/", authenticateAccessToken, upload.single("prescriptionImage"), createMedicalRecord);
router.get("/worker/:workerId", authenticateAccessToken, listWorkerRecords);
router.get("/:id", authenticateAccessToken, getMedicalRecord);

export default router;
