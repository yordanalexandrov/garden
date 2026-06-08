import type { AppConfig } from "../../config/config.js";
import { OpenMeteoWeatherAdapter } from "./open-meteo.adapter.js";
import { TestWeatherAdapter } from "./test-weather.adapter.js";
import type { WeatherPort } from "./weather.port.js";

export function createWeatherAdapter(config: AppConfig): WeatherPort {
  if (config.nodeEnv === "test" || config.integrations.weatherProvider === undefined) {
    return new TestWeatherAdapter();
  }

  return new OpenMeteoWeatherAdapter(
    config.integrations.openMeteoBaseUrl === undefined ? {} : { baseUrl: config.integrations.openMeteoBaseUrl }
  );
}
