import { z } from "zod";

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

const optionalNullableString = z.preprocess((val) => {
  if (val === undefined) return undefined;
  if (val === null || (typeof val === "string" && val.trim() === "")) return null;
  return val;
}, z.string().trim().nullable().optional());

const optionalNullableNumber = z.preprocess((val) => {
  if (val === undefined) return undefined;
  if (val === null || (typeof val === "string" && val.trim() === "")) return null;
  const num = Number(val);
  return Number.isNaN(num) ? val : num;
}, z.number().nullable().optional());

const optionalNullableDate = z.preprocess((val) => {
  if (val === undefined) return undefined;
  if (val === null || (typeof val === "string" && val.trim() === "")) return null;
  return val;
}, z.string().refine((d) => !Number.isNaN(new Date(d).getTime()), {
  message: "Invalid date format",
}).nullable().optional());

export const applicationIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Application ID must be a numeric ID"),
});

export const createApplicationSchema = z.object({
  job: z.object({
    title: z.string().trim().min(1, "Job title is required"),
    companyName: z.string().trim().min(1, "Company name is required"),
    workMode: z.enum(VALID_WORK_MODES, {
      message: `Invalid workMode. Allowed values are: ${VALID_WORK_MODES.join(", ")}`,
    }),
    location: optionalNullableString,
    employmentType: optionalNullableString,
    salaryMin: optionalNullableNumber,
    salaryMax: optionalNullableNumber,
    salaryCurrency: optionalNullableString,
    description: optionalNullableString,
    jobUrl: optionalNullableString,
    source: optionalNullableString,
  }),
  application: z.object({
    status: z.enum(VALID_APPLICATION_STATUSES, {
      message: `Invalid status. Allowed values are: ${VALID_APPLICATION_STATUSES.join(", ")}`,
    }),
    notes: optionalNullableString,
    appliedAt: optionalNullableDate,
  }),
});

export const updateApplicationSchema = z
  .object({
    job: z
      .object({
        title: z.string().trim().min(1, "Job title cannot be empty").optional(),
        companyName: z.string().trim().min(1, "Company name cannot be empty").optional(),
        workMode: z.enum(VALID_WORK_MODES, {
          message: `Invalid workMode. Allowed values are: ${VALID_WORK_MODES.join(", ")}`,
        }).optional(),
        location: optionalNullableString,
        employmentType: optionalNullableString,
        salaryMin: optionalNullableNumber,
        salaryMax: optionalNullableNumber,
        salaryCurrency: optionalNullableString,
        description: optionalNullableString,
        jobUrl: optionalNullableString,
        source: optionalNullableString,
      })
      .optional(),
    application: z
      .object({
        status: z.enum(VALID_APPLICATION_STATUSES, {
          message: `Invalid status. Allowed values are: ${VALID_APPLICATION_STATUSES.join(", ")}`,
        }).optional(),
        notes: optionalNullableString,
        appliedAt: optionalNullableDate,
      })
      .optional(),
  })
  .refine(
    (data) => data.job !== undefined || data.application !== undefined,
    {
      message: "Request body must include job or application data",
    }
  );

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationIdParamInput = z.infer<typeof applicationIdParamSchema>;
