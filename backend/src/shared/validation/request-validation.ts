import type { FastifyRequest } from "fastify";
import type { z } from "zod";

import { AppError } from "../errors/app-error.js";

type RequestPart = "body" | "query" | "params";

export type RequestValidationSchemas = {
  body?: z.ZodType;
  query?: z.ZodType;
  params?: z.ZodType;
};

type ParsedSchemas<TSchemas extends RequestValidationSchemas> = {
  [K in keyof TSchemas]: TSchemas[K] extends z.ZodType ? z.infer<TSchemas[K]> : never;
};

function pathForIssue(part: RequestPart, issue: z.core.$ZodIssue): string {
  const nestedPath = issue.path.map((segment) => String(segment)).join(".");
  return nestedPath.length > 0 ? `${part}.${nestedPath}` : part;
}

export function detailsFromZodError(part: RequestPart, error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = pathForIssue(part, issue);
    details[field] ??= [];
    details[field].push(issue.message);
  }

  return details;
}

export function validateRequestPart<TSchema extends z.ZodType>(
  part: RequestPart,
  schema: TSchema,
  value: unknown
): z.infer<TSchema> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid input", detailsFromZodError(part, result.error));
  }

  return result.data;
}

export function validateRequest<TSchemas extends RequestValidationSchemas>(
  request: FastifyRequest,
  schemas: TSchemas
): ParsedSchemas<TSchemas> {
  const parsed: Partial<Record<keyof TSchemas, unknown>> = {};

  if (schemas.body !== undefined) {
    parsed.body = validateRequestPart("body", schemas.body, request.body);
  }

  if (schemas.query !== undefined) {
    parsed.query = validateRequestPart("query", schemas.query, request.query);
  }

  if (schemas.params !== undefined) {
    parsed.params = validateRequestPart("params", schemas.params, request.params);
  }

  return parsed as ParsedSchemas<TSchemas>;
}
