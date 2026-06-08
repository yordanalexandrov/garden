import { isWeatherProviderError, type WeatherPort } from "../../integrations/weather/weather.port.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AuthenticatedActor, UUID } from "../auth/auth.types.js";
import type { RainConfirmationResponse, WeatherEvent, WeatherForecast, WeatherPlace, WeatherRepository } from "./weather.types.js";

export class WeatherService {
  constructor(
    private readonly weatherRepository: WeatherRepository,
    private readonly weatherPort: WeatherPort
  ) {}

  async getForecastForPlace(actor: AuthenticatedActor, placeId: UUID): Promise<WeatherForecast> {
    const place = await this.weatherRepository.findPlaceById(actor.accountId, placeId);

    if (place === null) {
      throw new AppError("NOT_FOUND", "Place not found");
    }

    if (!place.weatherEnabled) {
      return {
        placeId: place.id,
        enabled: false,
        locationLabel: null,
        forecast: []
      };
    }

    if (!hasWeatherLocation(place)) {
      throw new AppError("BUSINESS_RULE_VIOLATION", "Weather-enabled place requires weather location data");
    }

    try {
      const result = await this.weatherPort.getForecastForPlace({
        placeId: place.id,
        locationLabel: place.weatherLocationLabel,
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone
      });

      return {
        placeId: place.id,
        enabled: true,
        locationLabel: place.weatherLocationLabel,
        forecast: result.forecast
      };
    } catch (error) {
      if (isWeatherProviderError(error)) {
        throw new AppError("EXTERNAL_SERVICE_ERROR", "Weather provider failed");
      }

      throw error;
    }
  }

  async confirmRain(actor: AuthenticatedActor, weatherEventId: UUID, response: RainConfirmationResponse): Promise<WeatherEvent> {
    const event = await this.weatherRepository.findById(actor.accountId, weatherEventId);

    if (event === null) {
      throw new AppError("NOT_FOUND", "Weather event not found");
    }

    if (event.eventType !== "rain_check") {
      throw new AppError("BUSINESS_RULE_VIOLATION", "Only rain-check weather events can be confirmed");
    }

    const updated = await this.weatherRepository.updateRainConfirmation(
      actor.accountId,
      event.id,
      response,
      observedRainFromResponse(response)
    );

    if (updated === null) {
      throw new AppError("NOT_FOUND", "Weather event not found");
    }

    return updated;
  }
}

export function observedRainFromResponse(response: RainConfirmationResponse): boolean | null {
  if (response === "confirmed_yes") {
    return true;
  }

  if (response === "confirmed_no") {
    return false;
  }

  return null;
}

function hasWeatherLocation(place: WeatherPlace): boolean {
  const hasLabel = place.weatherLocationLabel !== null && place.weatherLocationLabel.trim().length > 0;
  const hasCoordinates = place.latitude !== null && place.longitude !== null;

  return hasLabel || hasCoordinates;
}
