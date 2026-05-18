import { z } from "zod";

import {
  includeArchivedQuerySchema,
  optionalSearchQuerySchema,
  paginationQuerySchema,
  uuidSchema
} from "../../shared/validation/common-schemas.js";

const optionalTextBodyFieldSchema = z.string().trim().nullable().optional();
const latitudeSchema = z.number().min(-90).max(90).nullable().optional();
const longitudeSchema = z.number().min(-180).max(180).nullable().optional();

const placeWritableShape = {
  name: z.string().trim().min(1),
  description: optionalTextBodyFieldSchema,
  notes: optionalTextBodyFieldSchema,
  weatherEnabled: z.boolean(),
  weatherLocationLabel: optionalTextBodyFieldSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  timezone: optionalTextBodyFieldSchema
};

export const placeParamsSchema = z.object({
  placeId: uuidSchema
});

export const listPlacesQuerySchema = paginationQuerySchema.extend({
  q: optionalSearchQuerySchema,
  includeArchived: includeArchivedQuerySchema
});

export const createPlaceBodySchema = z
  .object({
    ...placeWritableShape,
    weatherEnabled: placeWritableShape.weatherEnabled.default(false)
  })
  .superRefine(validateWeatherLocation);

export const updatePlaceBodySchema = z
  .object(placeWritableShape)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  })
  .superRefine(validateWeatherLocation);

export type ListPlacesQuery = z.infer<typeof listPlacesQuerySchema>;
export type CreatePlaceBody = z.infer<typeof createPlaceBodySchema>;
export type UpdatePlaceBody = z.infer<typeof updatePlaceBodySchema>;
export type PlaceParams = z.infer<typeof placeParamsSchema>;

type WeatherLocationInput = {
  weatherEnabled?: boolean | undefined;
  weatherLocationLabel?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
};

function validateWeatherLocation(value: WeatherLocationInput, context: z.RefinementCtx): void {
  if (value.weatherEnabled !== true) {
    return;
  }

  const hasLocationLabel =
    typeof value.weatherLocationLabel === "string" && value.weatherLocationLabel.trim().length > 0;
  const hasCompleteCoordinates =
    value.latitude !== undefined && value.latitude !== null && value.longitude !== undefined && value.longitude !== null;

  if (!hasLocationLabel && !hasCompleteCoordinates) {
    context.addIssue({
      code: "custom",
      path: ["weatherLocationLabel"],
      message: "weatherEnabled requires weatherLocationLabel or both latitude and longitude"
    });
  }
}
