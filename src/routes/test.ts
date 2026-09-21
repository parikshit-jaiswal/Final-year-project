import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  const name = req.query.name || "World";

  res.json({
    success: true,
    message: `Hello ${name}! This is a test route.`,
    timestamp: new Date().toISOString(),
    method: "GET",
  });
});

export default router;
