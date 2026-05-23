import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PlaceDetail } from '../../places.models';
import { PlacesApiService } from '../../places-api.service';

interface PlaceNavigationItem {
  readonly label: string;
  readonly path: string;
}

const placeNavigationItems: readonly PlaceNavigationItem[] = [
  { label: 'Overview', path: 'overview' },
  { label: 'Trees / Perennials', path: 'perennials' },
  { label: 'Beds', path: 'beds' },
  { label: 'Activities', path: 'activities' },
  { label: 'Problems', path: 'problems' },
  { label: 'Calendar', path: 'calendar' },
  { label: 'Weather', path: 'weather' },
];

@Component({
  selector: 'app-place-detail-shell',
  imports: [ApiErrorSummary, MatTabsModule, PageHeader, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './place-detail-shell.html',
  styleUrl: './place-detail-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceDetailShell {
  readonly navigationItems = placeNavigationItems;
  readonly place = signal<PlaceDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly placesApi = inject(PlacesApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
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
