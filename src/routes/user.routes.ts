import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";

import {
  registerUser,
  loginUser,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/login", loginUser);
router.get("/test", authenticate, (req, res) => {
  res.json({
    message: "Middleware works",
    user: (req as any).user,
  });
});


export default router;
