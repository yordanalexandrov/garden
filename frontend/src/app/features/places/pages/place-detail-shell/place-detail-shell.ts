import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PlaceDetailStore } from '../../place-detail-store';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

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
  imports: [LoadingIndicator, ApiErrorSummary, MatTabsModule, PageHeader, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './place-detail-shell.html',
  styleUrl: './place-detail-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PlaceDetailStore],
})
export class PlaceDetailShell {
  private readonly route = inject(ActivatedRoute);
  private readonly placeDetailStore = inject(PlaceDetailStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly navigationItems = placeNavigationItems;
  readonly place = this.placeDetailStore.place;
  readonly loading = this.placeDetailStore.loading;
  readonly error = this.placeDetailStore.error;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const placeId = params.get('placeId');

      if (placeId !== null) {
        this.placeDetailStore.load(placeId);
      }
    });
  }
}
