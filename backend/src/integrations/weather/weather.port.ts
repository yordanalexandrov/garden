import type {
  ForecastSnapshotInput,
  ForecastSnapshotResult,
  RainRiskInput,
  RainRiskResult,
  WeatherForecastInput,
  WeatherForecastResult
} from "./weather.types.js";

export interface WeatherPort {
  getForecastForPlace(input: WeatherForecastInput): Promise<WeatherForecastResult>;
  getRainRiskForDate(input: RainRiskInput): Promise<RainRiskResult>;
  captureForecastSnapshot(input: ForecastSnapshotInput): Promise<ForecastSnapshotResult>;
}

export class WeatherProviderError extends Error {
  constructor(message = "Weather provider failed") {
    super(message);
    this.name = "WeatherProviderError";
  }
}

export function isWeatherProviderError(error: unknown): error is WeatherProviderError {
  return error instanceof WeatherProviderError;
}
