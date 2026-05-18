import { z } from "zod";

import {
  includeArchivedQuerySchema,
  optionalSearchQuerySchema,
  paginationQuerySchema,
  uuidSchema
} from "../../shared/validation/common-schemas.js";
import { PLANT_GROWING_STYLES, PLANT_LIFECYCLE_TYPES } from "./plants.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();

export const lifecycleTypeSchema = z.enum(PLANT_LIFECYCLE_TYPES);
export const growingStyleSchema = z.enum(PLANT_GROWING_STYLES);

const plantWritableShape = {
  commonName: z.string().trim().min(1),
  variety: optionalTextBodyFieldSchema,
  plantCategory: optionalTextBodyFieldSchema,
  lifecycleType: lifecycleTypeSchema,
  growingStyle: growingStyleSchema,
  notes: optionalTextBodyFieldSchema
};

export const plantParamsSchema = z.object({
  plantId: uuidSchema
});

export const listPlantsQuerySchema = paginationQuerySchema.extend({
  q: optionalSearchQuerySchema,
  lifecycleType: lifecycleTypeSchema.optional(),
  growingStyle: growingStyleSchema.optional(),
  includeArchived: includeArchivedQuerySchema
});

export const createPlantBodySchema = z.object(plantWritableShape);

export const updatePlantBodySchema = z.object(plantWritableShape).partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

export type ListPlantsQuery = z.infer<typeof listPlantsQuerySchema>;
export type CreatePlantBody = z.infer<typeof createPlantBodySchema>;
export type UpdatePlantBody = z.infer<typeof updatePlantBodySchema>;
export type PlantParams = z.infer<typeof plantParamsSchema>;
