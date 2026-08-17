import type { Request, Response } from "express";
import pool from "../config/db.js";

//Validator functions
const stringValidator = (str: unknown) => {
  if (typeof(str) !== "string") {
    return false;
  }
  return true;
}

const stringNotNullValidator = (str: unknown) => {
  if (typeof(str) !== "string" || str === "") {
    return false;
  }
  return true;
}

const numValidator = (num: unknown) => {
  return typeof num === "number";
}

export const createJob = async (req: Request, res: Response) => {
  //Request
  try {
    const {
      title,
      companyName,
      location,
      workMode,
      employment_type,
      salary_min,
      salary_max,
      salary_currency,
      description,
      job_url,
      source
    } = req.body;

    //Validation
    if (!stringValidator(location)
      || !stringValidator(salary_currency)
      || !stringValidator(employment_type)
      || !stringValidator(description)
      || !stringValidator(job_url)
      || !stringValidator(source)) {
      
      console.error("the data must be string");
      const strError = new Error("the data must be string") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    if (!stringNotNullValidator(title)
      || !stringNotNullValidator(companyName)
      || !stringNotNullValidator(workMode)) {
      
        console.error("the data must be non-empty string");
        const strError = new Error("the data must be non-empty string") as Error & {status: number};
        strError.status = 400;
        
        throw strError;
    }

    if (!numValidator(salary_min)
      || !numValidator(salary_max)) {
      
        console.error("the data must be number");
        const strError = new Error("the data must be number") as Error & {status: number};
        strError.status = 400;
        
        throw strError;
    }
    
    //Repostories
    const result = await pool.query(
      `INSERT INTO jobs
      (title, company_name, location, work_mode, employment_type,
      salary_min, salary_max, salary_currency, description,
      job_url, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [title, companyName, location, workMode, employment_type,
        salary_min, salary_max, salary_currency, description,
        job_url, source]
    );
    
    //Return to API call
    return res.status(201).json({job:result.rows[0]});
  }
  catch (error: any) {
    console.error(`Error creating job ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const getAllJobs = async (req: Request, res: Response) => {
  // TODO: get all jobs
};

export const getJobById = async (req: Request, res: Response) => {
  // TODO: get job by id
};

export const updateJob = async (req: Request, res: Response) => {
  // TODO: update job
};

export const deleteJob = async (req: Request, res: Response) => {
  // TODO: delete job
};