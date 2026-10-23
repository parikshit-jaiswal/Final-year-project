import { Router } from "express";
import multer from "multer";
import {
  getProvider,
  registerProvider,
  updateProvider,
} from "../controllers/provider.controller.js";
import { authenticateAccessToken } from "../middleware/auth.middleware.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("conditionPhoto must be an image"));
      return;
    }
    callback(null, true);
  },
});

router.post("/", registerProvider);
router.get("/:id", authenticateAccessToken, getProvider);
router.patch("/:id", authenticateAccessToken, upload.single("conditionPhoto"), updateProvider);

export default router;
