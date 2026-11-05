import { Router } from "express";
import { getWorker, loginWorker, registerWorker, updateWorker } from "../controllers/worker.controller.js";
import { authenticateAccessToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", registerWorker);
router.post("/login", loginWorker);
router.get("/:workerId", authenticateAccessToken, getWorker);
router.patch("/:workerId", authenticateAccessToken, updateWorker);

export default router;
