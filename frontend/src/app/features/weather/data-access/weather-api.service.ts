import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../../core/api/api-client';
import {
  ConfirmRainRequest,
  PlaceWeatherForecast,
  RainConfirmationResponse,
  RainConfirmationResult,
} from '../weather.models';

@Injectable({ providedIn: 'root' })
export class WeatherApiService {
  private readonly api = inject(ApiClient);

  getPlaceForecast(placeId: string): Observable<PlaceWeatherForecast> {
    return this.api.get<PlaceWeatherForecast>(
      `/places/${encodeURIComponent(placeId)}/weather/forecast`,
    );
  }

  confirmRain(
    weatherEventId: string,
    response: RainConfirmationResponse,
  ): Observable<RainConfirmationResult> {
    const request: ConfirmRainRequest = { response };

    return this.api.post<RainConfirmationResult>(
      `/weather/events/${encodeURIComponent(weatherEventId)}/confirm-rain`,
      request,
    );
  }
}
