import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodType } from "zod";

export interface RequestValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export const validate = (schema: ZodType | RequestValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ("parseAsync" in schema || "parse" in schema) {
        req.body = await (schema as ZodType).parseAsync(req.body);
      } else {
        const schemas = schema as RequestValidationSchemas;
        if (schemas.body) {
          req.body = await schemas.body.parseAsync(req.body);
        }
        if (schemas.params) {
          req.params = (await schemas.params.parseAsync(req.params)) as any;
        }
        if (schemas.query) {
          req.query = (await schemas.query.parseAsync(req.query)) as any;
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedMessage = error.issues
          .map((issue) => {
            const field = issue.path.join(".");
            return field ? `${field}: ${issue.message}` : issue.message;
          })
          .join("; ");

        return res.status(400).json({
          message: formattedMessage || "Validation failed",
          errors: error.issues,
        });
      }
      next(error);
    }
  };
};
