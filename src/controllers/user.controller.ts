import type { Request, Response } from "express";
import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}


const stringNotNullValidator = (str: unknown) => {
  if (typeof(str) !== "string" || str === "") {
    return false;
  }
  return true;
}

export const registerUser = async (req: Request, res: Response) => {
  try {
    //Request
    const {
      name,
      email,
      password
    } = req.body;
    
    //Validation
    if (!stringNotNullValidator(name)
      || !stringNotNullValidator(email)
      || !stringNotNullValidator(password)) 
    {
        console.error("the data must be string");
        const strError = new Error("the data must be string") as Error & {status: number};
        strError.status = 400;
        throw strError;
    }

    //Checking if email already exists
    const is_mail_exists = await pool.query(
      `SELECT 1 FROM users WHERE email = $1 LIMIT 1;`, [email]
    );

    if (is_mail_exists.rowCount && is_mail_exists.rowCount > 0) {
      const error = new Error("Email already exists") as Error & { status: number };
      error.status = 409;
      throw error;
    }

    //Hashing password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Creating user
    const result = await pool.query(
      `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, "createdAt", "updatedAt";
      `,
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    
    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    //Return to API call
    return res.status(201).json({
          message: "User registered successfully",
          user,
    });
    
  }
  catch (error: any) {
    console.error(`Error in registering user: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    //Request
    const {
      email,
      password
    } = req.body;

    //Validation
    if (!stringNotNullValidator(email)
      || !stringNotNullValidator(password)) 
    {
        console.error("the data must be string");
        const strError = new Error("the data must be string") as Error & {status: number};
        strError.status = 400;
        throw strError;
    }

    //Checking if email exists
    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1 LIMIT 1;`, [email]
    );

    if (!userResult.rowCount || userResult.rowCount === 0) {
      const error = new Error("Email doesn't exists") as Error & { status: number };
      error.status = 401;
      throw error;
    }

    const user = userResult.rows[0];

    //Comparing password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error("Invalid email or password") as Error & { status: number };
      error.status = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    //Return to API call
    return res.status(200).json({
          message: "User logged in successfully",
          user,
    });
  }
  catch (error: any) {
    console.error(`Error in logging in user: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
}

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (userId === undefined) {
      const error = new Error("Authentication required") as Error & { status: number };
      error.status = 401;
      throw error;
    }

    const userResult = await pool.query(
      `SELECT id, name, email, "createdAt", "updatedAt" FROM users WHERE id = $1 LIMIT 1;`, [userId]
    );

    if (!userResult.rowCount || userResult.rowCount === 0) {
      const error = new Error("User not found") as Error & { status: number };
      error.status = 404;
      throw error;
    }

    const user = userResult.rows[0];

    return res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  }
  catch (error: any) {
    console.error(`Error in fetching user profile: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
}

export const logoutUser = (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });

  return res.status(200).json({ message: "Logged out successfully" });
}
