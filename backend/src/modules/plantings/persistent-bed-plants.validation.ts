import { z } from "zod";

import {
  nonNegativeNumberSchema,
  paginationQuerySchema,
  saneYearSchema,
  uuidSchema
} from "../../shared/validation/common-schemas.js";
import { PERSISTENT_BED_PLANT_STATUSES } from "./persistent-bed-plants.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();

export const persistentBedPlantStatusSchema = z.enum(PERSISTENT_BED_PLANT_STATUSES);

const persistentBedPlantWritableShape = {
  plantId: uuidSchema,
  plantedYear: saneYearSchema.nullable().optional(),
  quantity: nonNegativeNumberSchema.nullable().optional(),
  notes: optionalTextBodyFieldSchema
};

export const bedPersistentPlantsParamsSchema = z.object({
  bedId: uuidSchema
});

export const persistentBedPlantParamsSchema = z.object({
  id: uuidSchema
});

export const listPersistentBedPlantsQuerySchema = paginationQuerySchema.extend({
  status: persistentBedPlantStatusSchema.optional()
});

export const createPersistentBedPlantBodySchema = z.object(persistentBedPlantWritableShape);

export const updatePersistentBedPlantBodySchema = z
  .object({
    ...persistentBedPlantWritableShape,
    status: persistentBedPlantStatusSchema
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type BedPersistentPlantsParams = z.infer<typeof bedPersistentPlantsParamsSchema>;
export type PersistentBedPlantParams = z.infer<typeof persistentBedPlantParamsSchema>;
export type ListPersistentBedPlantsQuery = z.infer<typeof listPersistentBedPlantsQuerySchema>;
export type CreatePersistentBedPlantBody = z.infer<typeof createPersistentBedPlantBodySchema>;
export type UpdatePersistentBedPlantBody = z.infer<typeof updatePersistentBedPlantBodySchema>;
