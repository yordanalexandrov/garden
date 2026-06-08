export const RAIN_CONFIRMATION_RESPONSES = [
  'confirmed_yes',
  'confirmed_no',
  'ignored',
] as const;

export type RainConfirmationResponse = (typeof RAIN_CONFIRMATION_RESPONSES)[number];

export type WeatherEventConfirmationStatus = 'pending' | RainConfirmationResponse;

export interface WeatherForecastItem {
  readonly date: string;
  readonly temperatureMinC: number | null;
  readonly temperatureMaxC: number | null;
  readonly rainProbability: number | null;
  readonly summary: string | null;
}

export interface PlaceWeatherForecast {
  readonly placeId: string;
  readonly enabled: boolean;
  readonly locationLabel?: string | null;
  readonly forecast: readonly WeatherForecastItem[];
}

export interface ConfirmRainRequest {
  readonly response: RainConfirmationResponse;
}

export interface RainConfirmationResult {
  readonly id: string;
  readonly userConfirmationStatus: RainConfirmationResponse;
  readonly observedRain: boolean | null;
}

export interface RainConfirmationEvent {
  readonly id: string;
  readonly eventType: string;
  readonly userConfirmationStatus: WeatherEventConfirmationStatus | string | null;
  readonly observedRain: boolean | null;
}
