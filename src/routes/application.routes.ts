import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createApplicationSchema,
  updateApplicationSchema,
  applicationIdParamSchema,
} from "../schemas/application.schema.js";
import {
  createApplication,
  getAllApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} from "../controllers/application.controller.js";

const router = express.Router();

router.post("/", authenticate, validate(createApplicationSchema), createApplication);
router.get("/", authenticate, getAllApplications);
router.get("/:id", authenticate, validate({ params: applicationIdParamSchema }), getApplicationById);
router.put(
  "/:id",
  authenticate,
  validate({ params: applicationIdParamSchema, body: updateApplicationSchema }),
  updateApplication
);
router.delete("/:id", authenticate, validate({ params: applicationIdParamSchema }), deleteApplication);

export default router;