import { z } from "zod";

import { uuidSchema } from "../../shared/validation/common-schemas.js";
import { RAIN_CONFIRMATION_RESPONSES } from "./weather.types.js";

export const weatherPlaceParamsSchema = z.object({
  placeId: uuidSchema
});

export const weatherEventParamsSchema = z.object({
  weatherEventId: uuidSchema
});

export const confirmRainBodySchema = z.object({
  response: z.enum(RAIN_CONFIRMATION_RESPONSES)
});

export type WeatherPlaceParams = z.infer<typeof weatherPlaceParamsSchema>;
export type WeatherEventParams = z.infer<typeof weatherEventParamsSchema>;
export type ConfirmRainBody = z.infer<typeof confirmRainBodySchema>;
