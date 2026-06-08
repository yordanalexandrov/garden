import type { JsonValue } from "../../db/database.types.js";
import type { NormalizedForecastDay } from "../../integrations/weather/weather.types.js";
import type { UUID } from "../auth/auth.types.js";

export const RAIN_CONFIRMATION_RESPONSES = ["confirmed_yes", "confirmed_no", "ignored"] as const;
export type RainConfirmationResponse = (typeof RAIN_CONFIRMATION_RESPONSES)[number];

export const WEATHER_EVENT_TYPES = ["rain_check", "forecast_snapshot"] as const;
export type WeatherEventType = (typeof WEATHER_EVENT_TYPES)[number];

export const WEATHER_RELATED_ENTITY_TYPES = ["task", "activity"] as const;
export type WeatherRelatedEntityType = (typeof WEATHER_RELATED_ENTITY_TYPES)[number];

export const WEATHER_CONFIRMATION_STATUSES = ["pending", "confirmed_yes", "confirmed_no", "ignored"] as const;
export type WeatherConfirmationStatus = (typeof WEATHER_CONFIRMATION_STATUSES)[number];

export type WeatherPlace = {
  id: UUID;
  accountId: UUID;
  weatherEnabled: boolean;
  weatherLocationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
};

export type WeatherForecast = {
  placeId: UUID;
  enabled: boolean;
  locationLabel: string | null;
  forecast: NormalizedForecastDay[];
};

export type WeatherEvent = {
  id: UUID;
  accountId: UUID;
  placeId: UUID;
  relatedEntityType: WeatherRelatedEntityType;
  relatedEntityId: UUID;
  eventType: WeatherEventType;
  forecastedRain: boolean | null;
  observedRain: boolean | null;
  userConfirmationStatus: WeatherConfirmationStatus | null;
  providerPayload: JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWeatherEventInput = {
  accountId: UUID;
  placeId: UUID;
  relatedEntityType: WeatherRelatedEntityType;
  relatedEntityId: UUID;
  eventType: WeatherEventType;
  forecastedRain: boolean | null;
  observedRain?: boolean | null;
  userConfirmationStatus?: WeatherConfirmationStatus | null;
  providerPayload?: JsonValue | null;
};

export interface WeatherRepository {
  findPlaceById(accountId: UUID, placeId: UUID): Promise<WeatherPlace | null>;
  createEvent(input: CreateWeatherEventInput): Promise<WeatherEvent>;
  findById(accountId: UUID, weatherEventId: UUID): Promise<WeatherEvent | null>;
  findByRelatedEntity(accountId: UUID, relatedEntityType: WeatherRelatedEntityType, relatedEntityId: UUID): Promise<WeatherEvent[]>;
  updateRainConfirmation(
    accountId: UUID,
    weatherEventId: UUID,
    status: RainConfirmationResponse,
    observedRain: boolean | null
  ): Promise<WeatherEvent | null>;
}
