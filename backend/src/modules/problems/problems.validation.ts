import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "../../shared/validation/common-schemas.js";
import { TARGET_TYPES } from "../targets/target-resolver.types.js";
import { PROBLEM_CATEGORIES, PROBLEM_STATUSES, PROBLEM_TYPES } from "./problems.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();

export const problemParamsSchema = z.object({
  problemId: uuidSchema
});

export const problemListQuerySchema = paginationQuerySchema.extend({
  placeId: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), uuidSchema.optional()),
  type: z.enum(PROBLEM_TYPES).optional(),
  status: z.enum(PROBLEM_STATUSES).optional(),
  category: z.enum(PROBLEM_CATEGORIES).optional(),
  from: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), z.string().datetime().optional()),
  to: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), z.string().datetime().optional())
});

export const createProblemBodySchema = z
  .object({
    type: z.enum(PROBLEM_TYPES),
    placeId: uuidSchema,
    targetType: z.enum(TARGET_TYPES),
    targetId: uuidSchema,
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    category: z.enum(PROBLEM_CATEGORIES).nullable().optional(),
    severity: optionalTextBodyFieldSchema,
    status: z.enum(PROBLEM_STATUSES),
    observedAt: z.string().datetime(),
    linkedActivityId: uuidSchema.nullable().optional()
  })
  .strict();

export const updateProblemBodySchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    category: z.enum(PROBLEM_CATEGORIES).nullable().optional(),
    severity: optionalTextBodyFieldSchema,
    status: z.enum(PROBLEM_STATUSES).optional(),
    observedAt: z.string().datetime().optional(),
    linkedActivityId: uuidSchema.nullable().optional()
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: "At least one field must be provided" });

export type ProblemParams = z.infer<typeof problemParamsSchema>;
export type ProblemListQuery = z.infer<typeof problemListQuerySchema>;
export type CreateProblemBody = z.infer<typeof createProblemBodySchema>;
export type UpdateProblemBody = z.infer<typeof updateProblemBodySchema>;

export const observationParamsSchema = z.object({
  problemId: uuidSchema,
  obsId: uuidSchema
});

export const createObservationBodySchema = z
  .object({
    summary: z.string().trim().min(1),
    recommendation: z.string().trim().min(1).nullable().optional()
  })
  .strict();

export const updateObservationBodySchema = z
  .object({
    summary: z.string().trim().min(1).optional(),
    recommendation: z.string().trim().min(1).nullable().optional()
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: "At least one field must be provided" });

export type ObservationParams = z.infer<typeof observationParamsSchema>;
export type CreateObservationBody = z.infer<typeof createObservationBodySchema>;
export type UpdateObservationBody = z.infer<typeof updateObservationBodySchema>;
