import { Router } from "express";
import { getProvider, registerProvider } from "../controllers/provider.controller.js";
import { authenticateAccessToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", registerProvider);
router.get("/:id", authenticateAccessToken, getProvider);

export default router;
