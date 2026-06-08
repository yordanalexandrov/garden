import type { UUID } from "../../modules/auth/auth.types.js";

export type NormalizedForecastDay = {
  date: string;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  rainProbability: number | null;
  summary: string;
};

export type WeatherForecastInput = {
  placeId: UUID;
  locationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
};

export type WeatherForecastResult = {
  forecast: NormalizedForecastDay[];
};

export type RainRiskInput = {
  placeId: UUID;
  date: string;
  locationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
};

export type RainRiskResult = {
  date: string;
  rainProbability: number | null;
  forecastedRain: boolean | null;
};

export type ForecastSnapshotInput = WeatherForecastInput & {
  date: string;
};

export type ForecastSnapshotResult = {
  forecastedRain: boolean | null;
  providerPayload: Record<string, unknown> | null;
};
