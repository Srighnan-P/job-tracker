import express from "express";
import jobRoutes from "./routes/jobs.routes.js";

const app = express();

app.use(express.json());
app.use("/api/jobs", jobRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Job Tracker API is running"
  });
});

export default app;