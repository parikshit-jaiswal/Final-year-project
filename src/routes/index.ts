import { Router } from "express";
import testRoutes from "./test.js";

const router = Router();

router.use("/", testRoutes);

export default router;