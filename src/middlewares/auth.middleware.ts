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
    // Prefer HttpOnly cookie (browser clients), fall back to Bearer header (API clients e.g. Postman)
    const cookieToken: string | undefined = req.cookies?.token;
    const authHeader = req.headers.authorization;

    let token: string | undefined;

    if (cookieToken) {
      // Cookie path — no stripping needed, value is the raw JWT
      token = cookieToken;
    } else if (authHeader) {
      // Authorization header path
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Invalid authorization format" });
      }
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Make sure decoded value contains userId
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded)
    ) {
      return res.status(401).json({ message: "Invalid authentication token" });
    }

    // Attach userId to request
    req.userId = decoded.userId;

    // Continue to controller
    next();
  }
  catch (error: any) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
