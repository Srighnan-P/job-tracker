import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({message: "Authentication required",});
    }

    // Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({message: "Invalid authorization format",});
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({message: "Authentication token missing",});
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Make sure decoded value contains userId
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded)
    ) {
      return res.status(401).json({message: "Invalid authentication token",});
    }

    // Attach userId to request
    req.userId = decoded.userId;

    // Continue to controller
    next();
  }
  catch (error: any) {
    return res.status(401).json({message: "Invalid or expired token",});
  }
}
