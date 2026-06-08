import { DatePipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { WeatherApiService } from '../../data-access/weather-api.service';
import { PlaceWeatherForecast } from '../../weather.models';

@Component({
  selector: 'app-place-weather-page',
  imports: [
    ApiErrorSummary,
    DatePipe,
    EmptyState,
    MatCardModule,
    MatIconModule,
    PageHeader,
    PercentPipe,
  ],
  templateUrl: './place-weather-page.html',
  styleUrl: './place-weather-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceWeatherPage {
  readonly forecast = signal<PlaceWeatherForecast | null>(null);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly weatherApi = inject(WeatherApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadForecast();
  }

  loadForecast(): void {
    const placeId = this.route.parent?.snapshot.paramMap.get('placeId');

    if (!placeId) {
      this.error.set(new ApiError('VALIDATION_ERROR', 'Place id is required.'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.weatherApi
      .getPlaceForecast(placeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (forecast) => {
          this.forecast.set(forecast);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
