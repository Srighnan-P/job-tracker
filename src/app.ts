import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js"
import applicationRoutes from "./routes/application.routes.js"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/api/application", applicationRoutes);
app.use("/api/auth", userRoutes);
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Job Tracker API is running"
  });
});

export default app;