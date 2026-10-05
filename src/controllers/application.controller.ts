import type { Request, Response } from "express";
import pool from "../config/db.js";

export const VALID_APPLICATION_STATUSES = [
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof VALID_APPLICATION_STATUSES)[number];

export const VALID_WORK_MODES = [
  "remote",
  "hybrid",
  "onsite",
] as const;

export type WorkMode = (typeof VALID_WORK_MODES)[number];

const statusValidator = (status: unknown): status is ApplicationStatus => {
  return typeof status === "string" && (VALID_APPLICATION_STATUSES as readonly string[]).includes(status);
};

const workModeValidator = (mode: unknown): mode is WorkMode => {
  return typeof mode === "string" && (VALID_WORK_MODES as readonly string[]).includes(mode);
};

const stringValidator = (str: unknown) => {
  if (str != undefined && str !== null)
    return typeof str === "string";
  else
    return true;
};

const stringNotNullValidator = (str: unknown) => {
  if (typeof (str) !== "string" || str.trim() === "") {
    return false;
  }
  return true;
};

const toNullIfEmpty = (val: unknown) => {
  if (val === undefined || val === null) {
    return null;
  }
  if (typeof val === "string" && val.trim() === "") {
    return null;
  }
  return val;
};

const toNumOrNull = (num: unknown) => {
  if (num === undefined || num === null || (typeof num === "string" && num.trim() === "")) {
    return null;
  }
  return Number(num);
};

const numValidator = (num: unknown) => {
  if (typeof num === "undefined" || num === null || num === "") {
    return true;
  }

  if (typeof num === "number") {
    return Number.isFinite(num);
  }

  if (typeof num === "string") {
    return num.trim() !== "" && !Number.isNaN(Number(num));
  }

  return false;
};

const dateValidator = (d: unknown) => {
  if (d === undefined || d === null || d === "") {
    return true;
  }
  if (typeof d === "string" || d instanceof Date) {
    const parsed = new Date(d as string | Date);
    return !Number.isNaN(parsed.getTime());
  }
  return false;
};

//Create application
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

    if (!req.body || typeof req.body !== "object") {
      const error = new Error("Request body is required") as Error & { status: number };
      error.status = 400;
      throw error;
    }

    const {
      job,
      application
    } = req.body;

    if (!job || typeof job !== "object" || !application || typeof application !== "object") {
      const error = new Error("Both job and application objects are required in request body") as Error & { status: number };
      error.status = 400;
      throw error;
    }

    if (!stringNotNullValidator(job.title)
      || !stringNotNullValidator(job.companyName)
      || !stringNotNullValidator(job.workMode)
      || !stringNotNullValidator(application.status)) {
      
      console.error("the data must be non-empty string");
      const strError = new Error("title, companyName, workMode, and status are required non-empty strings") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    if (!workModeValidator(job.workMode)) {
      const error = new Error(
        `Invalid workMode '${job.workMode}'. Allowed values are: ${VALID_WORK_MODES.join(", ")}`
      ) as Error & { status: number };
      error.status = 400;
      throw error;
    }

    if (!statusValidator(application.status)) {
      const error = new Error(
        `Invalid status '${application.status}'. Allowed values are: ${VALID_APPLICATION_STATUSES.join(", ")}`
      ) as Error & { status: number };
      error.status = 400;
      throw error;
    }

    if (!numValidator(job.salaryMin) || !numValidator(job.salaryMax)) {
      
      console.error("the data must be number");
      const strError = new Error("the data must be number") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    if (!dateValidator(application.appliedAt)) {
      console.error("the applied date must be a valid date");
      const strError = new Error("the applied date must be a valid date") as Error & {status: number};
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
      [
        job.title,
        job.companyName,
        toNullIfEmpty(job.location),
        job.workMode,
        toNullIfEmpty(job.employmentType),
        toNumOrNull(job.salaryMin),
        toNumOrNull(job.salaryMax),
        toNullIfEmpty(job.salaryCurrency),
        toNullIfEmpty(job.description),
        toNullIfEmpty(job.jobUrl),
        toNullIfEmpty(job.source)
      ]
    )

    const result = await client.query(
      `INSERT INTO applications
      (user_id, job_id, status, notes, "appliedAt")
      VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_TIMESTAMP))
      RETURNING *, TO_CHAR("appliedAt", 'YYYY-MM-DD') AS "appliedAt"`,
      [
        userId,
        jobResult.rows[0].id,
        application.status,
        toNullIfEmpty(application.notes),
        toNullIfEmpty(application.appliedAt)
      ]
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
        console.error(`Error rolling back transaction: ${rollbackError}`);
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

//Get all applications
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
          TO_CHAR(a."appliedAt", 'YYYY-MM-DD') AS applied_at,
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

    return res.status(200).json({applications:result.rows});
      
  }
  catch (error: any) {
    console.error(`Error getting all applications: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

//Get application by id
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const applicationId = req.params.id;
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

    if (!numValidator(applicationId)) {
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
          TO_CHAR(a."appliedAt", 'YYYY-MM-DD') AS applied_at,
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
        
        WHERE a.id = $1
          AND a.user_id = $2;
      `, [applicationId, userId]
    )

    if (result.rows.length === 0) {
      const error = new Error("Application not found") as Error & { status: number };
      error.status = 404;
      throw error;
    }

    return res.status(200).json({application:result.rows[0]});
    
  }
  catch (error: any) {
    console.error(`Error getting application: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

//Update application by id
export const updateApplication = async (req: Request, res: Response) => {
  let client;
  let transactionBegin = false;
  try {
    const applicationId = req.params.id;
    const userId = req.userId;
    //Validators
    if (userId === undefined) {
      const error = new Error("Authentication required") as Error & { status: number };
      error.status = 401;
      throw error;
    }
    

    if (!numValidator(userId) || !numValidator(applicationId)) {
      console.error("the data must be number");
      const strError = new Error("the data must be number") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    if (!req.body || typeof req.body !== "object") {
      const error = new Error("Request body is required") as Error & { status: number };
      error.status = 400;
      throw error;
    }

    const {
      job,
      application
    } = req.body;

    if (!job && !application) {
      const error = new Error("Request body must include job or application data") as Error & { status: number };
      error.status = 400;
      throw error;
    }

    if (job !== undefined && (typeof job !== "object" || job === null)) {
      const error = new Error("Job data must be an object") as Error & { status: number };
      error.status = 400;
      throw error;
    }

    if (application !== undefined && (typeof application !== "object" || application === null)) {
      const error = new Error("Application data must be an object") as Error & { status: number };
      error.status = 400;
      throw error;
    }

    if (
      !stringValidator(job?.title) ||
      !stringValidator(job?.companyName) ||
      !stringValidator(job?.location) ||
      !stringValidator(job?.workMode) ||
      !stringValidator(job?.employmentType) ||
      !stringValidator(job?.salaryCurrency) ||
      !stringValidator(job?.description) ||
      !stringValidator(job?.jobUrl) ||
      !stringValidator(job?.source) ||
      !stringValidator(application?.status) ||
      !stringValidator(application?.notes)
    ) {
      console.error("the data must be string");
      const strError = new Error("the data must be string") as Error & { status: number };
      strError.status = 400;
      throw strError;
    }

    if (job?.workMode !== undefined && job?.workMode !== null && job?.workMode !== "") {
      if (!workModeValidator(job.workMode)) {
        const error = new Error(
          `Invalid workMode '${job.workMode}'. Allowed values are: ${VALID_WORK_MODES.join(", ")}`
        ) as Error & { status: number };
        error.status = 400;
        throw error;
      }
    }

    if (application?.status !== undefined && application?.status !== null && application?.status !== "") {
      if (!statusValidator(application.status)) {
        const error = new Error(
          `Invalid status '${application.status}'. Allowed values are: ${VALID_APPLICATION_STATUSES.join(", ")}`
        ) as Error & { status: number };
        error.status = 400;
        throw error;
      }
    }

    if (!dateValidator(application?.appliedAt)) {
      console.error("the applied date must be a valid date");
      const strError = new Error("the applied date must be a valid date") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    if (!numValidator(job?.salaryMin) || !numValidator(job?.salaryMax)) {
      console.error("the data must be number");
      const strError = new Error("the data must be number") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    //Repository
    

    client = await pool.connect();
    await client.query("BEGIN")
    transactionBegin = true;
    
    const jobResult = await client.query(
      `UPDATE jobs
        SET title = COALESCE($1, title),
            company_name = COALESCE($2, company_name),
            location = COALESCE($3, location),
            work_mode = COALESCE($4, work_mode),
            employment_type = COALESCE($5, employment_type),
            salary_min = COALESCE($6, salary_min),
            salary_max = COALESCE($7, salary_max),
            salary_currency = COALESCE($8, salary_currency),
            description = COALESCE($9, description),
            job_url = COALESCE($10, job_url),
            source = COALESCE($11, source)
        WHERE id = (SELECT job_id FROM applications WHERE id = $12 AND user_id = $13)
          AND EXISTS (SELECT 1 FROM applications WHERE id = $12 AND user_id = $13)
        RETURNING *`,
      [
        toNullIfEmpty(job?.title),
        toNullIfEmpty(job?.companyName),
        toNullIfEmpty(job?.location),
        toNullIfEmpty(job?.workMode),
        toNullIfEmpty(job?.employmentType),
        toNumOrNull(job?.salaryMin),
        toNumOrNull(job?.salaryMax),
        toNullIfEmpty(job?.salaryCurrency),
        toNullIfEmpty(job?.description),
        toNullIfEmpty(job?.jobUrl),
        toNullIfEmpty(job?.source),
        applicationId,
        userId
      ]
    );

    if (jobResult.rowCount === 0) {
      const error = new Error("Job not found or not authorized") as Error & { status: number };
      error.status = 404;
      throw error;
    }

    const result = await client.query(
      `UPDATE applications
        SET status = COALESCE($1, status),
            notes = COALESCE($2, notes),
            "appliedAt" = COALESCE($3, "appliedAt"),
            updated_at = NOW()
        WHERE id = $4
          AND user_id = $5
        RETURNING *, TO_CHAR("appliedAt", 'YYYY-MM-DD') AS "appliedAt"`,
      [
        toNullIfEmpty(application?.status),
        toNullIfEmpty(application?.notes),
        toNullIfEmpty(application?.appliedAt),
        applicationId,
        userId
      ]
    );

    if (result.rowCount === 0) {
      const error = new Error("Application not found or not authorized") as Error & { status: number };
      error.status = 404;
      throw error;
    }

    await client.query("COMMIT")
    transactionBegin = false;

    return res.status(200).json({application:result.rows[0], job:jobResult.rows[0]});


  }
  catch (error: any) {
    if (client && transactionBegin) {
      try {
        await client.query("ROLLBACK");
      }
      catch(rollbackError) {
        console.error(`Error rolling back transaction: ${rollbackError}`);
      }
    }
    console.error(`Error updating application: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
  finally {
    if (client) {
      client.release();
    }
  }
};

//Delete application by id
export const deleteApplication = async (req: Request, res: Response) => {
  let client;
  let transactionBegin = false;
  try {
    const userId = req.userId;
    const applicationId = req.params.id;
        
    if (userId === undefined) {
      const error = new Error("Authentication required") as Error & { status: number };
      error.status = 401;
      throw error;
    }
    
    if (!numValidator(userId) || !numValidator(applicationId)) {
      const strError = new Error("the data must be number") as Error & {status: number};
      strError.status = 400;
      
      throw strError;
    }

    client = await pool.connect();
    await client.query("BEGIN")
    transactionBegin = true;
    
    
    const applicationResult = await client.query(
      `DELETE FROM applications
        WHERE id = $1
          AND user_id = $2
        RETURNING job_id`,
      [applicationId, userId]
    );

    if (applicationResult.rowCount === 0) {
      const error = new Error("Application not found") as Error & { status: number; };
      error.status = 404;
      throw error;
    }
  
    const jobId = applicationResult.rows[0].job_id;
  
    await client.query(
      `DELETE FROM jobs
        WHERE id = $1`,
      [jobId]
    );
    

    await client.query("COMMIT")
    transactionBegin = false;
  
    return res.status(200).json({message:"Application deleted successfully"});
    

    
  }
  catch (error: any) {
    if (client && transactionBegin) {
      try {
        await client.query("ROLLBACK");
      }
      catch(rollbackError) {
        console.error(`Error rolling back transaction: ${rollbackError}`);
      }
    }
    console.error(`Error deleting application: ${error.message}`);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
  finally {
    if (client) {
      client.release();
    }
  }
};