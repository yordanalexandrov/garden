import type { WeatherEvent, WeatherForecast } from "./weather.types.js";

export function toWeatherForecastDto(forecast: WeatherForecast): WeatherForecastDto {
  return {
    placeId: forecast.placeId,
    enabled: forecast.enabled,
    ...(forecast.locationLabel === null ? {} : { locationLabel: forecast.locationLabel }),
    forecast: forecast.forecast.map((item) => ({
      date: item.date,
      temperatureMinC: item.temperatureMinC,
      temperatureMaxC: item.temperatureMaxC,
      rainProbability: item.rainProbability,
      summary: item.summary
    }))
  };
}

export function toRainConfirmationDto(event: WeatherEvent): RainConfirmationDto {
  return {
    id: event.id,
    userConfirmationStatus: event.userConfirmationStatus,
    observedRain: event.observedRain
  };
}

type WeatherForecastDto = {
  placeId: string;
  enabled: boolean;
  locationLabel?: string;
  forecast: Array<{
    date: string;
    temperatureMinC: number | null;
    temperatureMaxC: number | null;
    rainProbability: number | null;
    summary: string;
  }>;
};

type RainConfirmationDto = {
  id: string;
  userConfirmationStatus: string | null;
  observedRain: boolean | null;
};
