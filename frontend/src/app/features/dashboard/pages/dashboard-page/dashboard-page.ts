import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusChip } from '../../../../shared/components/status-chip/status-chip';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { DashboardApiService } from '../../dashboard-api.service';
import { DashboardSummary } from '../../dashboard.models';

const emptyDashboard = (): DashboardSummary => ({
  upcomingTasks: [],
  suggestedTasks: [],
  activeQuarantinePeriods: [],
  recentActivities: [],
  openProblems: [],
  lowStockProducts: [],
  places: [],
});

@Component({
  selector: 'app-dashboard-page',
  imports: [
    ApiErrorSummary,
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
    RouterLink,
    StatusChip,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  readonly dashboard = signal<DashboardSummary>(emptyDashboard());
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly placeId = new FormControl<string | null>(null);

  private readonly dashboardApi = inject(DashboardApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardApi
      .getDashboard({ placeId: this.placeId.value || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dashboard) => {
          this.dashboard.set(dashboard);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
