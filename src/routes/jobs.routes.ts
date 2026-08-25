import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { 
    createJob, 
    getAllJobs, 
    getJobById, 
    updateJob, 
    deleteJob 
} from "../controllers/job.controller.js";

const router = express.Router();

router.post("/",authenticate, createJob);
router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);

export default router;
