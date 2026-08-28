import type { Request, Response } from "express";
import pool from "../config/db.js";

const stringValidator = (str: unknown) => {
  if (str != undefined)
    return typeof str === "string";
  else
    return true;
};

const stringNotNullValidator = (str: unknown) => {
  if (typeof (str) !== "string" || str === "") {
    return false;
  }
  return true;
};

const numValidator = (num: number) => {
  if (typeof num !== "undefined") {
    // console.log(num)
    return typeof num === "number";
  }
  else
    return true;
};


export const createApplication = async (req: Request, res: Response) => {
  let client;
  let transactionBegin = false;
  try {
    const userId = req.userId;

    if (userId === undefined) {
      const error = new Error("Authentication required") as Error & { status: number };
      error.status = 401;
      throw error;
    }

    const {
      job,
      application
    } = req.body;


    if (!stringNotNullValidator(job.title)
      ||!stringNotNullValidator(job.companyName)
      ||!stringNotNullValidator(job.workMode)
      || !stringNotNullValidator(application.status)) {
      
      console.error("the data must be non-empty string");
      const strError = new Error("the data must be non-empty string") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    if (!numValidator(job.salaryMin) || !numValidator(job.salaryMax)) {
      
      console.error("the data must be number");
      const strError = new Error("the data must be number") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    client = await pool.connect();
    await client.query("BEGIN")
    transactionBegin = true;

    const jobResult = await client.query(
      `INSERT INTO jobs
      (title, company_name, location, work_mode, employment_type,
      salary_min, salary_max, salary_currency, description,
      job_url, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [job.title, job.companyName, job.location, job.workMode, job.employmentType,
        job.salaryMin, job.salaryMax, job.salaryCurrency, job.description,
        job.jobUrl, job.source]
    )

    const result = await client.query(
      `INSERT INTO applications
      (user_id, job_id, status, notes)
      vALUES ($1, $2, $3, $4)
      RETURNING *`,
      [userId, jobResult.rows[0].id, application.status, application.notes]
    )
    await client.query("COMMIT")
    transactionBegin = false;

    return res.status(201).json({application:result.rows[0]});
    
  }
  catch (error: any) {
    if (client && transactionBegin) {
      try {
        await client.query("ROLLBACK");
      }
      catch(rollbackError) {
        console.error(`Error creating application: ${rollbackError}`);
      }
    }
    console.error(`Error creating application: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
  finally {
    if (client) {
      client.release();
    }
  }
};

export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (userId === undefined) {
      const error = new Error("Authentication required") as Error & { status: number };
      error.status = 401;
      throw error;
    }
    

    if (!numValidator(userId)) {
      console.error("the data must be number");
      const strError = new Error("the data must be number") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    const result = await pool.query(
      ` SELECT
          a.id AS application_id,
          a.user_id,
          a.status,
          a.notes,
          a.created_at,
          a.updated_at,
      
          j.id AS job_id,
          j.title,
          j.company_name,
          j.location,
          j.work_mode,
          j.employment_type,
          j.salary_min,
          j.salary_max,
          j.salary_currency,
          j.description,
          j.job_url,
          j.source
      
        FROM applications AS a
        JOIN jobs AS j
            ON a.job_id = j.id
        
        WHERE a.user_id = $1
        
        ORDER BY a.created_at DESC;
      `, [userId]
    )

    return res.status(201).json({job:result.rows});
      
  }
  catch (error: any) {
    console.error(`Error getting all application: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

export const getApplicationById = async (req: Request, res: Response) => { };

export const updateApplication = async (req: Request, res: Response) => { };

export const deleteApplication = async (req: Request, res: Response) => { };