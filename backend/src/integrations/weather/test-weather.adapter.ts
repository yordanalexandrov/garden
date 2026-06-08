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

export type TestWeatherAdapterOptions = {
  failForecasts?: boolean;
  forecast?: NormalizedForecastDay[];
};

const DEFAULT_FORECAST: NormalizedForecastDay[] = [
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
];

export class TestWeatherAdapter implements WeatherPort {
  readonly forecastCalls: WeatherForecastInput[] = [];
  readonly rainRiskCalls: RainRiskInput[] = [];
  readonly snapshotCalls: ForecastSnapshotInput[] = [];

  constructor(private readonly options: TestWeatherAdapterOptions = {}) {}

  async getForecastForPlace(input: WeatherForecastInput): Promise<WeatherForecastResult> {
    await Promise.resolve();
    this.forecastCalls.push(input);

    if (this.options.failForecasts === true) {
      throw new WeatherProviderError("Test weather forecast failed");
    }

    return { forecast: this.options.forecast ?? DEFAULT_FORECAST };
  }

  async getRainRiskForDate(input: RainRiskInput): Promise<RainRiskResult> {
    await Promise.resolve();
    this.rainRiskCalls.push(input);

    if (this.options.failForecasts === true) {
      throw new WeatherProviderError("Test weather rain risk failed");
    }

    const day = (this.options.forecast ?? DEFAULT_FORECAST).find((item) => item.date === input.date);

    return {
      date: input.date,
      rainProbability: day?.rainProbability ?? null,
      forecastedRain: day?.rainProbability === null || day?.rainProbability === undefined ? null : day.rainProbability >= 0.3
    };
  }

  async captureForecastSnapshot(input: ForecastSnapshotInput): Promise<ForecastSnapshotResult> {
    await Promise.resolve();
    this.snapshotCalls.push(input);

    const risk = await this.getRainRiskForDate(input);

    return {
      forecastedRain: risk.forecastedRain,
      providerPayload: {
        provider: "test",
        date: input.date,
        rainProbability: risk.rainProbability
      }
    };
  }
}
