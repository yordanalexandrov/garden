import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { WeatherApiService } from '../../data-access/weather-api.service';
import {
  RainConfirmationEvent,
  RainConfirmationResponse,
  RainConfirmationResult,
} from '../../weather.models';

@Component({
  selector: 'app-rain-confirmation-prompt',
  imports: [ApiErrorSummary, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './rain-confirmation-prompt.html',
  styleUrl: './rain-confirmation-prompt.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RainConfirmationPrompt {
  readonly event = input.required<RainConfirmationEvent>();
  readonly confirmed = output<RainConfirmationResult>();

  readonly mutating = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly currentStatus = signal<string | null>(null);
  readonly observedRain = signal<boolean | null>(null);

  private readonly weatherApi = inject(WeatherApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const event = this.event();

      this.currentStatus.set(event.userConfirmationStatus);
      this.observedRain.set(event.observedRain);
      this.error.set(null);
    });
  }

  readonly isPending = (): boolean =>
    this.event().eventType === 'rain_check' && this.currentStatus() === 'pending';

  confirm(response: RainConfirmationResponse): void {
    if (!this.isPending() || this.mutating()) {
      return;
    }

    this.mutating.set(true);
    this.error.set(null);

    this.weatherApi
      .confirmRain(this.event().id, response)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.currentStatus.set(result.userConfirmationStatus);
          this.observedRain.set(result.observedRain);
          this.mutating.set(false);
          this.confirmed.emit(result);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.mutating.set(false);
        },
      });
  }
}
