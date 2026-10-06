import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "../schemas/user.schema.js";

import {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout", authenticate, logoutUser);
router.get("/me", authenticate, getUserProfile);
router.get("/test", authenticate, (req, res) => {
  res.json({
    message: "Middleware works",
    user: (req as any).user,
  });
});


export default router;
