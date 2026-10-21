import "dotenv/config";
import app from "./app";
import { connectDatabase } from "./config/database";

const PORT = Number(process.env.PORT ?? 5000);

async function bootstrap() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
    console.log(`Click here: http://localhost:${PORT}/api`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error("Unable to start server", error);
  process.exitCode = 1;
});
