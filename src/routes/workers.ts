import { Router } from "express";
import { getWorker, loginWorker, registerWorker } from "../controllers/worker.controller.js";
import { authenticateAccessToken } from "../utils/auth.js";

const router = Router();

router.post("/", registerWorker);
router.post("/login", loginWorker);
router.get("/:workerId", authenticateAccessToken, getWorker);

export default router;
