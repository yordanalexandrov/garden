import { z } from "zod";

import {
  includeArchivedQuerySchema,
  optionalSearchQuerySchema,
  paginationQuerySchema,
  positiveNumberSchema,
  uuidSchema
} from "../../shared/validation/common-schemas.js";
import { PRODUCT_CATEGORIES, SIMPLE_UNITS } from "./products.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();
const nullableNonNegativeIntegerSchema = z.number().int().min(0).nullable().optional();

export const productCategorySchema = z.enum(PRODUCT_CATEGORIES);
export const simpleUnitSchema = z.enum(SIMPLE_UNITS);

const productWritableShape = {
  name: z.string().trim().min(1),
  category: productCategorySchema,
  activeSubstance: optionalTextBodyFieldSchema,
  manufacturer: optionalTextBodyFieldSchema,
  formulation: optionalTextBodyFieldSchema,
  defaultUnit: simpleUnitSchema,
  notes: optionalTextBodyFieldSchema
};

const productUsageRuleWritableShape = {
  plantId: uuidSchema,
  doseValue: positiveNumberSchema,
  doseUnit: simpleUnitSchema,
  dilutionText: optionalTextBodyFieldSchema,
  applicationMethod: optionalTextBodyFieldSchema,
  reapplicationIntervalDays: nullableNonNegativeIntegerSchema,
  quarantinePeriodDays: nullableNonNegativeIntegerSchema,
  notes: optionalTextBodyFieldSchema
};

export const productParamsSchema = z.object({
  productId: uuidSchema
});

export const productUsageRuleParamsSchema = z.object({
  ruleId: uuidSchema
});

export const listProductsQuerySchema = paginationQuerySchema.extend({
  q: optionalSearchQuerySchema,
  category: productCategorySchema.optional(),
  includeArchived: includeArchivedQuerySchema
});

export const createProductBodySchema = z.object(productWritableShape);

export const updateProductBodySchema = z.object(productWritableShape).partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export const createProductUsageRuleBodySchema = z.object(productUsageRuleWritableShape);

export const updateProductUsageRuleBodySchema = z
  .object(productUsageRuleWritableShape)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
export type ProductParams = z.infer<typeof productParamsSchema>;
export type CreateProductUsageRuleBody = z.infer<typeof createProductUsageRuleBodySchema>;
export type UpdateProductUsageRuleBody = z.infer<typeof updateProductUsageRuleBodySchema>;
export type ProductUsageRuleParams = z.infer<typeof productUsageRuleParamsSchema>;
