import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
// app.use(
//   pinoHttp({
//     autoLogging: {
//       ignore: (req: any) => req.url === "/api/health",
//     },
//   })
// );
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Job Tracker API is running",
  });
});

app.use("/api/application", applicationRoutes);
app.use("/api/auth", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;