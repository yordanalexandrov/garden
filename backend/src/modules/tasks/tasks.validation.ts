import { z } from "zod";

import { paginationQuerySchema, uuidSchema } from "../../shared/validation/common-schemas.js";
import { TARGET_SCOPE_TYPES } from "../targets/target-resolver.types.js";
import { TASK_SOURCE_TYPES, TASK_STATUSES, TASK_TYPES } from "./tasks.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date");
const optionalTargetSelectionSchema = z
  .object({
    perennialIds: z.array(uuidSchema).optional(),
    bedIds: z.array(uuidSchema).optional(),
    yearlyPlantingIds: z.array(uuidSchema).optional(),
    persistentBedPlantIds: z.array(uuidSchema).optional()
  })
  .strict()
  .optional();

export const taskParamsSchema = z.object({
  taskId: uuidSchema
});

export const taskListQuerySchema = paginationQuerySchema.extend({
  placeId: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), uuidSchema.optional()),
  status: z.enum(TASK_STATUSES).optional(),
  type: z.enum(TASK_TYPES).optional(),
  sourceType: z.enum(TASK_SOURCE_TYPES).optional(),
  dueFrom: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), dateOnlySchema.optional()),
  dueTo: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), dateOnlySchema.optional())
});

export const createTaskBodySchema = z
  .object({
    placeId: uuidSchema,
    type: z.enum(TASK_TYPES),
    dueDate: dateOnlySchema,
    notes: optionalTextBodyFieldSchema,
    status: z.enum(["planned", "suggested"]).default("planned"),
    targetScopeType: z.enum(TARGET_SCOPE_TYPES),
    targetSelection: optionalTargetSelectionSchema
  })
  .strict()
  .superRefine(validateTargetSelectionForScope);

export const patchTaskBodySchema = z
  .object({
    dueDate: dateOnlySchema.optional(),
    notes: optionalTextBodyFieldSchema,
    type: z.enum(TASK_TYPES).optional(),
    targetScopeType: z.enum(TARGET_SCOPE_TYPES).optional(),
    targetSelection: optionalTargetSelectionSchema
  })
  .strict()
  .superRefine((body, ctx) => {
    if (Object.keys(body).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["body"], message: "must contain at least one editable field" });
    }

    if (body.targetSelection !== undefined && body.targetScopeType === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetScopeType"],
        message: "is required when targetSelection is provided"
      });
    }

    if (body.targetScopeType !== undefined) {
      validateTargetSelectionForScope(body as { targetScopeType: (typeof TARGET_SCOPE_TYPES)[number]; targetSelection?: TargetSelectionBody }, ctx);
    }
  });

export type TaskParams = z.infer<typeof taskParamsSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type PatchTaskBody = z.infer<typeof patchTaskBodySchema>;

type TargetSelectionBody = z.infer<NonNullable<typeof optionalTargetSelectionSchema>>;
type BodyWithTargetScope = {
  targetScopeType: (typeof TARGET_SCOPE_TYPES)[number];
  targetSelection?: TargetSelectionBody;
};

function validateTargetSelectionForScope(body: BodyWithTargetScope, ctx: z.RefinementCtx): void {
  const selection = body.targetSelection ?? {};
  const allowedField = allowedSelectionField(body.targetScopeType);

  for (const field of ["perennialIds", "bedIds", "yearlyPlantingIds", "persistentBedPlantIds"] as const) {
    if (allowedField !== field && selection[field] !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetSelection", field],
        message: "is not allowed for this target scope"
      });
    }
  }

  if (allowedField === undefined) {
    return;
  }

  const ids = selection[allowedField];
  if (ids === undefined || ids.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetSelection", allowedField],
      message: "must contain at least one id"
    });
    return;
  }

  if (body.targetScopeType === "single_bed" && ids.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetSelection", allowedField],
      message: "must contain exactly 1 id"
    });
  }

  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targetSelection", allowedField],
      message: "must not contain duplicate ids"
    });
  }
}

function allowedSelectionField(scope: (typeof TARGET_SCOPE_TYPES)[number]):
  | "perennialIds"
  | "bedIds"
  | "yearlyPlantingIds"
  | "persistentBedPlantIds"
  | undefined {
  switch (scope) {
    case "selected_perennials":
      return "perennialIds";
    case "selected_beds":
    case "single_bed":
      return "bedIds";
    case "selected_yearly_plantings":
      return "yearlyPlantingIds";
    case "selected_persistent_bed_plants":
      return "persistentBedPlantIds";
    case "whole_place":
    case "all_perennials_in_place":
    case "all_beds_in_place":
      return undefined;
  }
}
