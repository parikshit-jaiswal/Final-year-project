import { Router } from "express";
import { authenticateAccessToken } from "../utils/auth.js";
import { getProvider, registerProvider } from "../controllers/provider.controller.js";

const router = Router();

router.post("/", registerProvider);
router.get("/:id", authenticateAccessToken, getProvider);

export default router;
