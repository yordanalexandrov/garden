import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PlaceDetailStore } from '../../place-detail-store';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-place-overview-page',
  imports: [LoadingIndicator, ApiErrorSummary, MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './place-overview-page.html',
  styleUrl: './place-overview-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceOverviewPage {
  private readonly placeDetailStore = inject(PlaceDetailStore);

  readonly place = this.placeDetailStore.place;
  readonly loading = this.placeDetailStore.loading;
  readonly error = this.placeDetailStore.error;
}
