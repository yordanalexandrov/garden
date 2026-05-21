import { z } from "zod";

import {
  nonNegativeNumberSchema,
  paginationQuerySchema,
  saneYearQuerySchema,
  saneYearSchema,
  uuidSchema
} from "../../shared/validation/common-schemas.js";
import { YEARLY_BED_PLANTING_STATUSES } from "./yearly-bed-plantings.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();

export const yearlyBedPlantingStatusSchema = z.enum(YEARLY_BED_PLANTING_STATUSES);

const yearlyBedPlantingWritableShape = {
  plantId: uuidSchema,
  year: saneYearSchema,
  quantity: nonNegativeNumberSchema.nullable().optional(),
  notes: optionalTextBodyFieldSchema,
  status: yearlyBedPlantingStatusSchema
};

export const bedPlantingsParamsSchema = z.object({
  bedId: uuidSchema
});

export const yearlyBedPlantingParamsSchema = z.object({
  plantingId: uuidSchema
});

export const listYearlyBedPlantingsQuerySchema = paginationQuerySchema.extend({
  year: saneYearQuerySchema,
  status: yearlyBedPlantingStatusSchema.optional()
});

export const createYearlyBedPlantingBodySchema = z.object(yearlyBedPlantingWritableShape);

export const updateYearlyBedPlantingBodySchema = z
  .object(yearlyBedPlantingWritableShape)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type BedPlantingsParams = z.infer<typeof bedPlantingsParamsSchema>;
export type YearlyBedPlantingParams = z.infer<typeof yearlyBedPlantingParamsSchema>;
export type ListYearlyBedPlantingsQuery = z.infer<typeof listYearlyBedPlantingsQuerySchema>;
export type CreateYearlyBedPlantingBody = z.infer<typeof createYearlyBedPlantingBodySchema>;
export type UpdateYearlyBedPlantingBody = z.infer<typeof updateYearlyBedPlantingBodySchema>;
