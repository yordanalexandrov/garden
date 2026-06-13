import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusChip } from '../../../../shared/components/status-chip/status-chip';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PlacesApiService } from '../../../places/places-api.service';
import { PlaceListItem } from '../../../places/places.models';
import { TasksApiService } from '../../tasks-api.service';
import { TASK_STATUSES, TASK_TYPES, TaskListItem, TaskStatus, TaskType } from '../../tasks.models';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-tasks-list-page',
  imports: [
    LoadingIndicator,
    ApiErrorSummary,
    DatePipe,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
    RouterLink,
    StatusChip,
  ],
  templateUrl: './tasks-list-page.html',
  styleUrl: './tasks-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksListPage {
  readonly taskTypes = TASK_TYPES;
  readonly taskStatuses = TASK_STATUSES;
  readonly tasks = signal<readonly TaskListItem[]>([]);
  readonly places = signal<readonly PlaceListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly filters = new FormGroup({
    placeId: new FormControl<string | null>(null),
    status: new FormControl<TaskStatus | null>(null),
    type: new FormControl<TaskType | null>(null),
    dueFrom: new FormControl<string | null>(null),
    dueTo: new FormControl<string | null>(null),
  });

  private readonly tasksApi = inject(TasksApiService);
  private readonly placesApi = inject(PlacesApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.placesApi
      .list({ page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.places.set(result.items));
    this.search();
  }

  search(): void {
    this.loading.set(true);
    this.error.set(null);
    const value = this.filters.getRawValue();

    this.tasksApi
      .list({
        placeId: value.placeId || undefined,
        status: value.status || undefined,
        type: value.type || undefined,
        dueFrom: value.dueFrom || undefined,
        dueTo: value.dueTo || undefined,
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.tasks.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
