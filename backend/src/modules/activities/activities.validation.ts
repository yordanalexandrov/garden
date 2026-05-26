import { z } from "zod";

import { paginationQuerySchema, positiveNumberSchema, uuidSchema } from "../../shared/validation/common-schemas.js";
import { SIMPLE_UNITS } from "../products/products.types.js";
import { TARGET_SCOPE_TYPES, TARGET_TYPES } from "../targets/target-resolver.types.js";
import { ACTIVITY_TYPES } from "./activities.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();
const optionalTargetSelectionSchema = z
  .object({
    perennialIds: z.array(uuidSchema).optional(),
    bedIds: z.array(uuidSchema).optional(),
    yearlyPlantingIds: z.array(uuidSchema).optional(),
    persistentBedPlantIds: z.array(uuidSchema).optional()
  })
  .optional();

export const activityParamsSchema = z.object({
  activityId: uuidSchema
});

export const activityListQuerySchema = paginationQuerySchema
  .extend({
    placeId: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), uuidSchema.optional()),
    type: z.enum(ACTIVITY_TYPES).optional(),
    from: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), z.string().datetime().optional()),
    to: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), z.string().datetime().optional()),
    targetType: z.enum(TARGET_TYPES).optional(),
    targetId: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), uuidSchema.optional())
  })
  .superRefine((query, ctx) => {
    if ((query.targetType === undefined) !== (query.targetId === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: query.targetType === undefined ? ["targetType"] : ["targetId"],
        message: "targetType and targetId must be provided together"
      });
    }
  });

export const createActivityBodySchema = z
  .object({
    placeId: uuidSchema,
    type: z.enum(ACTIVITY_TYPES),
    performedAt: z.string().datetime(),
    targetScopeType: z.enum(TARGET_SCOPE_TYPES),
    targetSelection: optionalTargetSelectionSchema,
    notes: optionalTextBodyFieldSchema,
    productUsages: z
      .array(
        z.object({
          productId: uuidSchema,
          productUsageRuleId: uuidSchema.nullable().optional(),
          quantityUsed: positiveNumberSchema,
          unit: z.enum(SIMPLE_UNITS),
          notes: optionalTextBodyFieldSchema
        })
      )
      .optional(),
    allowInventoryShortage: z.boolean().default(false)
  })
  .superRefine((body, ctx) => {
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
  });

export const correctActivityBodySchema = z
  .object({
    reason: z.string().trim().min(1),
    inventoryCorrections: z
      .array(
        z
          .object({
            inventoryMovementId: uuidSchema,
            direction: z.enum(["increase_lot", "decrease_lot"]),
            quantity: positiveNumberSchema,
            unit: z.enum(SIMPLE_UNITS),
            notes: optionalTextBodyFieldSchema
          })
          .strict()
      )
      .min(1)
      .max(25)
  })
  .strict();

export type ActivityParams = z.infer<typeof activityParamsSchema>;
export type ActivityListQuery = z.infer<typeof activityListQuerySchema>;
export type CreateActivityBody = z.infer<typeof createActivityBodySchema>;
export type CorrectActivityBody = z.infer<typeof correctActivityBodySchema>;

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
