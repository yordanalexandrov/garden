import { describe, expect, it } from "vitest";

import { normalizeOpenMeteoDaily } from "../../src/integrations/weather/open-meteo.adapter.js";
import { TestWeatherAdapter } from "../../src/integrations/weather/test-weather.adapter.js";
import { WeatherProviderError } from "../../src/integrations/weather/weather.port.js";
import { toRainConfirmationDto, toWeatherForecastDto } from "../../src/modules/weather/weather.dto.js";
import { observedRainFromResponse } from "../../src/modules/weather/weather.service.js";
import type { WeatherEvent } from "../../src/modules/weather/weather.types.js";
import { confirmRainBodySchema } from "../../src/modules/weather/weather.validation.js";

describe("weather validation, DTOs, and adapters", () => {
  it("validates supported rain confirmation responses only", () => {
    expect(confirmRainBodySchema.safeParse({ response: "confirmed_yes" }).success).toBe(true);
    expect(confirmRainBodySchema.safeParse({ response: "confirmed_no" }).success).toBe(true);
    expect(confirmRainBodySchema.safeParse({ response: "ignored" }).success).toBe(true);
    expect(confirmRainBodySchema.safeParse({ response: "pending" }).success).toBe(false);
  });

  it("maps rain confirmation responses to observed rain exactly", () => {
    expect(observedRainFromResponse("confirmed_yes")).toBe(true);
    expect(observedRainFromResponse("confirmed_no")).toBe(false);
    expect(observedRainFromResponse("ignored")).toBeNull();
  });

  it("maps canonical forecast and rain confirmation DTOs without exposing provider payload", () => {
    const forecast = toWeatherForecastDto({
      placeId: "11111111-1111-4111-8111-111111111111",
      enabled: true,
      locationLabel: "Ruse, Bulgaria",
      forecast: [
        {
          date: "2026-05-13",
          temperatureMinC: 12,
          temperatureMaxC: 24,
          rainProbability: 0.4,
          summary: "Possible rain"
        }
      ]
    });
    const confirmation = toRainConfirmationDto(weatherEvent({ providerPayload: { provider: "test" } }));

    expect(forecast).toEqual({
      placeId: "11111111-1111-4111-8111-111111111111",
      enabled: true,
      locationLabel: "Ruse, Bulgaria",
      forecast: [
        {
          date: "2026-05-13",
          temperatureMinC: 12,
          temperatureMaxC: 24,
          rainProbability: 0.4,
          summary: "Possible rain"
        }
      ]
    });
    expect(JSON.stringify(forecast)).not.toContain("provider");
    expect(confirmation).toEqual({
      id: "99999999-9999-4999-8999-999999999999",
      userConfirmationStatus: "confirmed_yes",
      observedRain: true
    });
    expect(JSON.stringify(confirmation)).not.toContain("providerPayload");
  });

  it("returns stable deterministic forecasts and can simulate provider failure", async () => {
    const adapter = new TestWeatherAdapter();
    const failing = new TestWeatherAdapter({ failForecasts: true });

    const result = await adapter.getForecastForPlace({
      placeId: "11111111-1111-4111-8111-111111111111",
      locationLabel: "Ruse",
      latitude: 43.85,
      longitude: 25.96,
      timezone: "Europe/Sofia"
    });

    expect(result.forecast).toEqual(expect.arrayContaining([expect.objectContaining({ date: "2026-05-13", rainProbability: 0.4 })]));
    await expect(
      failing.getForecastForPlace({
        placeId: "11111111-1111-4111-8111-111111111111",
        locationLabel: "Ruse",
        latitude: 43.85,
        longitude: 25.96,
        timezone: "Europe/Sofia"
      })
    ).rejects.toBeInstanceOf(WeatherProviderError);
  });

  it("normalizes Open-Meteo daily payloads to canonical forecast days", () => {
    expect(
      normalizeOpenMeteoDaily({
        daily: {
          time: ["2026-05-13", "2026-05-14"],
          temperature_2m_min: [12, 10],
          temperature_2m_max: [24, 22],
          precipitation_probability_max: [40, 10]
        }
      })
    ).toEqual([
      {
        date: "2026-05-13",
        temperatureMinC: 12,
        temperatureMaxC: 24,
        rainProbability: 0.4,
        summary: "Possible rain"
      },
      {
        date: "2026-05-14",
        temperatureMinC: 10,
        temperatureMaxC: 22,
        rainProbability: 0.1,
        summary: "Mostly dry"
      }
    ]);
  });
});

function weatherEvent(overrides: Partial<WeatherEvent> = {}): WeatherEvent {
  return {
    id: "99999999-9999-4999-8999-999999999999",
    accountId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    placeId: "11111111-1111-4111-8111-111111111111",
    relatedEntityType: "task",
    relatedEntityId: "88888888-8888-4888-8888-888888888888",
    eventType: "rain_check",
    forecastedRain: true,
    observedRain: true,
    userConfirmationStatus: "confirmed_yes",
    providerPayload: null,
    createdAt: new Date("2026-05-13T00:00:00.000Z"),
    updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    ...overrides
  };
}
