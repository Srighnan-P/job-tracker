import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplication,
  deleteApplication
  
} from "../controllers/application.controller.js"

const router = express.Router();

router.post("/", authenticate, createApplication);
router.get("/", authenticate, getAllApplications);
router.get("/:id", authenticate, getApplicationById);
router.put("/:id", authenticate, updateApplication);
router.delete("/:id", authenticate, deleteApplication);

export default router;