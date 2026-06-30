import { WeatherProviderError, type WeatherPort } from "./weather.port.js";
import type {
  ForecastSnapshotInput,
  ForecastSnapshotResult,
  NormalizedForecastDay,
  RainRiskInput,
  RainRiskResult,
  WeatherForecastInput,
  WeatherForecastResult
} from "./weather.types.js";

type OpenMeteoDailyResponse = {
  daily?: {
    time?: string[];
    temperature_2m_min?: Array<number | null>;
    temperature_2m_max?: Array<number | null>;
    precipitation_probability_max?: Array<number | null>;
  };
};

export type OpenMeteoAdapterOptions = {
  baseUrl?: string;
  fetch?: typeof fetch;
};

export class OpenMeteoWeatherAdapter implements WeatherPort {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenMeteoAdapterOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.open-meteo.com/v1/forecast";
    this.fetchImpl = options.fetch ?? fetch;
  }

  async getForecastForPlace(input: WeatherForecastInput): Promise<WeatherForecastResult> {
    if (input.latitude === null || input.longitude === null) {
      throw new WeatherProviderError("Open-Meteo requires latitude and longitude");
    }

    const url = new URL(this.baseUrl);
    url.searchParams.set("latitude", String(input.latitude));
    url.searchParams.set("longitude", String(input.longitude));
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,precipitation_probability_max");
    url.searchParams.set("forecast_days", "7");
    url.searchParams.set("past_days", "14");

    if (input.timezone !== null && input.timezone.trim().length > 0) {
      url.searchParams.set("timezone", input.timezone);
    }

    const response = await this.fetchProvider(url);
    return { forecast: normalizeOpenMeteoDaily(response) };
  }

  async getRainRiskForDate(input: RainRiskInput): Promise<RainRiskResult> {
    const result = await this.getForecastForPlace(input);
    const day = result.forecast.find((item) => item.date === input.date);

    return {
      date: input.date,
      rainProbability: day?.rainProbability ?? null,
      forecastedRain: day?.rainProbability === null || day?.rainProbability === undefined ? null : day.rainProbability >= 0.3
    };
  }

  async captureForecastSnapshot(input: ForecastSnapshotInput): Promise<ForecastSnapshotResult> {
    const risk = await this.getRainRiskForDate(input);

    return {
      forecastedRain: risk.forecastedRain,
      providerPayload: {
        provider: "open-meteo",
        date: input.date,
        rainProbability: risk.rainProbability
      }
    };
  }

  private async fetchProvider(url: URL): Promise<OpenMeteoDailyResponse> {
    let response: Response;

    try {
      response = await this.fetchImpl(url);
    } catch (error) {
      throw new WeatherProviderError(error instanceof Error ? error.message : "Weather provider request failed");
    }

    if (!response.ok) {
      throw new WeatherProviderError(`Weather provider returned ${response.status}`);
    }

    try {
      return (await response.json()) as OpenMeteoDailyResponse;
    } catch {
      throw new WeatherProviderError("Weather provider returned invalid JSON");
    }
  }
}

export function normalizeOpenMeteoDaily(response: OpenMeteoDailyResponse): NormalizedForecastDay[] {
  const times = response.daily?.time ?? [];
  const mins = response.daily?.temperature_2m_min ?? [];
  const maxes = response.daily?.temperature_2m_max ?? [];
  const rainProbabilities = response.daily?.precipitation_probability_max ?? [];

  return times.map((date, index) => {
    const rainProbability = normalizeRainProbability(rainProbabilities[index] ?? null);

    return {
      date,
      temperatureMinC: mins[index] ?? null,
      temperatureMaxC: maxes[index] ?? null,
      rainProbability,
      summary: summarizeRainProbability(rainProbability)
    };
  });
}

function normalizeRainProbability(value: number | null): number | null {
  if (value === null) {
    return null;
  }

  return value > 1 ? value / 100 : value;
}

function summarizeRainProbability(value: number | null): string {
  if (value === null) {
    return "Forecast unavailable";
  }

  if (value >= 0.6) {
    return "Likely rain";
  }

  if (value >= 0.3) {
    return "Possible rain";
  }

  return "Mostly dry";
}
