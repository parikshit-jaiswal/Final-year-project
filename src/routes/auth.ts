import { Router } from "express";
import {
  logout,
  refreshAccessToken,
  requestProviderOtp,
  requestWorkerOtp,
  verifyProviderOtp,
  verifyWorkerOtp,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/providers/auth/request-otp", requestProviderOtp);
router.post("/workers/auth/request-otp", requestWorkerOtp);
router.post("/providers/auth/verify-otp", verifyProviderOtp);
router.post("/workers/auth/verify-otp", verifyWorkerOtp);
router.post("/auth/refresh", refreshAccessToken);
router.post("/auth/logout", logout);

export default router;
