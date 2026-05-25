import { z } from "zod";

import {
  optionalSearchQuerySchema,
  paginationQuerySchema,
  positiveNumberSchema,
  uuidSchema
} from "../../shared/validation/common-schemas.js";
import {
  INVENTORY_ADJUSTMENT_DIRECTIONS,
  INVENTORY_MOVEMENT_TYPES,
  MANUAL_ADJUSTMENT_MOVEMENT_TYPES,
  PRODUCT_CATEGORIES,
  SIMPLE_UNITS
} from "./inventory.types.js";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const optionalDateOnlySchema = dateOnlySchema.nullable().optional();
const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();
const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return false;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return value;
}, z.boolean());

export const inventoryUnitSchema = z.enum(SIMPLE_UNITS);
export const inventoryMovementTypeSchema = z.enum(INVENTORY_MOVEMENT_TYPES);
export const manualAdjustmentMovementTypeSchema = z.enum(MANUAL_ADJUSTMENT_MOVEMENT_TYPES);
export const inventoryAdjustmentDirectionSchema = z.enum(INVENTORY_ADJUSTMENT_DIRECTIONS);

export const inventoryProductParamsSchema = z.object({
  productId: uuidSchema
});

export const inventoryOverviewQuerySchema = paginationQuerySchema.extend({
  q: optionalSearchQuerySchema,
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  lowStockOnly: booleanQuerySchema,
  expiringBefore: z.preprocess(
    (value) => (value === undefined || value === "" ? undefined : value),
    dateOnlySchema.optional()
  )
});

export const inventoryLotsQuerySchema = paginationQuerySchema;

export const inventoryMovementsQuerySchema = paginationQuerySchema.extend({
  from: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), z.string().datetime().optional()),
  to: z.preprocess((value) => (value === undefined || value === "" ? undefined : value), z.string().datetime().optional()),
  movementType: inventoryMovementTypeSchema.optional()
});

export const createInventoryLotBodySchema = z.object({
  quantityInitial: positiveNumberSchema,
  unit: inventoryUnitSchema,
  purchaseDate: optionalDateOnlySchema,
  expiryDate: optionalDateOnlySchema,
  batchNumber: optionalTextBodyFieldSchema,
  notes: optionalTextBodyFieldSchema
});

export const manualInventoryAdjustmentBodySchema = z.object({
  productId: uuidSchema,
  inventoryLotId: uuidSchema,
  quantity: positiveNumberSchema,
  unit: inventoryUnitSchema,
  movementType: manualAdjustmentMovementTypeSchema,
  direction: inventoryAdjustmentDirectionSchema,
  notes: optionalTextBodyFieldSchema
});

export type InventoryProductParams = z.infer<typeof inventoryProductParamsSchema>;
export type InventoryOverviewQuery = z.infer<typeof inventoryOverviewQuerySchema>;
export type InventoryLotsQuery = z.infer<typeof inventoryLotsQuerySchema>;
export type InventoryMovementsQuery = z.infer<typeof inventoryMovementsQuerySchema>;
export type CreateInventoryLotBody = z.infer<typeof createInventoryLotBodySchema>;
export type ManualInventoryAdjustmentBody = z.infer<typeof manualInventoryAdjustmentBodySchema>;
