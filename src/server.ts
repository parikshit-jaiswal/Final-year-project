import app from "./app";
// import { connectDatabase } from "./config/database";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  //   await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
    console.log(`Click here : http://localhost:${5000}/api`);
  });
}

bootstrap();
