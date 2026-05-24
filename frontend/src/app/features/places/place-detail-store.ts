import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiError } from '../../core/errors/api-error';
import { mapApiError } from '../../core/errors/api-error.mapper';
import { PlaceDetail } from './places.models';
import { PlacesApiService } from './places-api.service';

@Injectable()
export class PlaceDetailStore {
  readonly place = signal<PlaceDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly placesApi = inject(PlacesApiService);
  private readonly destroyRef = inject(DestroyRef);
  private requestedPlaceId: string | null = null;

  load(placeId: string): void {
    const isNewPlace = this.requestedPlaceId !== placeId;

    if (!isNewPlace && (this.loading() || this.place() !== null)) {
      return;
    }

    this.requestedPlaceId = placeId;
    if (isNewPlace) {
      this.place.set(null);
    }
    this.loading.set(true);
    this.error.set(null);

    this.placesApi
      .get(placeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (place) => {
          if (this.requestedPlaceId !== placeId) {
            return;
          }

          this.place.set(place);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (this.requestedPlaceId !== placeId) {
            return;
          }

          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
