import { z } from "zod";

import {
  optionalSearchQuerySchema,
  paginationQuerySchema,
  positiveNumberSchema,
  saneYearQuerySchema,
  uuidSchema
} from "../../shared/validation/common-schemas.js";
import { BED_STATUSES } from "./beds.types.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();

export const bedStatusSchema = z.enum(BED_STATUSES);

const nullablePositiveNumberSchema = positiveNumberSchema.nullable().optional();

const bedWritableShape = {
  name: z.string().trim().min(1),
  description: optionalTextBodyFieldSchema,
  notes: optionalTextBodyFieldSchema,
  widthM: nullablePositiveNumberSchema,
  lengthM: nullablePositiveNumberSchema,
  areaM2: nullablePositiveNumberSchema
};

export const placeBedsParamsSchema = z.object({
  placeId: uuidSchema
});

export const bedParamsSchema = z.object({
  bedId: uuidSchema
});

export const listBedsQuerySchema = paginationQuerySchema.extend({
  q: optionalSearchQuerySchema,
  status: bedStatusSchema.optional(),
  year: saneYearQuerySchema
});

export const createBedBodySchema = z.object(bedWritableShape);

export const updateBedBodySchema = z
  .object({
    ...bedWritableShape,
    status: bedStatusSchema
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export type PlaceBedsParams = z.infer<typeof placeBedsParamsSchema>;
export type BedParams = z.infer<typeof bedParamsSchema>;
export type ListBedsQuery = z.infer<typeof listBedsQuerySchema>;
export type CreateBedBody = z.infer<typeof createBedBodySchema>;
export type UpdateBedBody = z.infer<typeof updateBedBodySchema>;
