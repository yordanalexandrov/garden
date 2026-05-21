import { z } from "zod";

import {
  optionalSearchQuerySchema,
  paginationQuerySchema,
  saneYearSchema,
  uuidSchema
} from "../../shared/validation/common-schemas.js";
import { PERENNIAL_STATUSES } from "./perennials.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();

export const perennialStatusSchema = z.enum(PERENNIAL_STATUSES);

const perennialWritableShape = {
  plantId: uuidSchema,
  label: optionalTextBodyFieldSchema,
  plantedYear: saneYearSchema.nullable().optional(),
  notes: optionalTextBodyFieldSchema
};

export const placePerennialsParamsSchema = z.object({
  placeId: uuidSchema
});

export const perennialParamsSchema = z.object({
  perennialId: uuidSchema
});

export const listPerennialsQuerySchema = paginationQuerySchema.extend({
  q: optionalSearchQuerySchema,
  status: perennialStatusSchema.optional()
});

export const createPerennialBodySchema = z.object(perennialWritableShape);

export const updatePerennialBodySchema = z
  .object({
    ...perennialWritableShape,
    status: perennialStatusSchema
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type PlacePerennialsParams = z.infer<typeof placePerennialsParamsSchema>;
export type PerennialParams = z.infer<typeof perennialParamsSchema>;
export type ListPerennialsQuery = z.infer<typeof listPerennialsQuerySchema>;
export type CreatePerennialBody = z.infer<typeof createPerennialBodySchema>;
export type UpdatePerennialBody = z.infer<typeof updatePerennialBodySchema>;
