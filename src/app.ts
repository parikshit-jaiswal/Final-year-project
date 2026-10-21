import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ZodError } from "zod";
import routes from "./routes/index.js";
// import { errorMiddleware } from "./middlewares/error.middleware";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    return res.status(409).json({
      success: false,
      message: "A record with one of these values already exists",
    });
  }

  console.error("Unhandled request error", error);
  return res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;
