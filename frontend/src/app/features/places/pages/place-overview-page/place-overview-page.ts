import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PlaceDetail } from '../../places.models';
import { PlacesApiService } from '../../places-api.service';

@Component({
  selector: 'app-place-overview-page',
  imports: [ApiErrorSummary, MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './place-overview-page.html',
  styleUrl: './place-overview-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceOverviewPage {
  readonly place = signal<PlaceDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly placesApi = inject(PlacesApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const placeId = params.get('placeId');

      if (placeId !== null) {
        this.loadPlace(placeId);
      }
    });
  }

  private loadPlace(placeId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.placesApi
      .get(placeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (place) => {
          this.place.set(place);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
