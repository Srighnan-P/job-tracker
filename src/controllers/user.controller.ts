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

    //Return to API call
    return res.status(201).json({
          message: "User registered successfully",
          user,
          token,
    });
    
  }
  catch (error: any) {
    console.error(`Error in registering user: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
}

