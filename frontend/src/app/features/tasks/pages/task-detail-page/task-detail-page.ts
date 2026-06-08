import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, map, switchMap } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { StatusChip } from '../../../../shared/components/status-chip/status-chip';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { TasksApiService } from '../../tasks-api.service';
import { ConfirmTaskResult, TaskDetail } from '../../tasks.models';

type TaskAction = 'confirm' | 'dismiss' | 'complete' | 'skip';

@Component({
  selector: 'app-task-detail-page',
  imports: [
    ApiErrorSummary,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    PageHeader,
    RouterLink,
    StatusChip,
  ],
  templateUrl: './task-detail-page.html',
  styleUrl: './task-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailPage {
  readonly task = signal<TaskDetail | null>(null);
  readonly lastConfirmResult = signal<ConfirmTaskResult | null>(null);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly tasksApi = inject(TasksApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadTask();
  }

  runAction(action: TaskAction): void {
    const task = this.task();

    if (task === null || this.mutating()) {
      return;
    }

    this.confirmAction(action)
      .pipe(
        switchMap((confirmed) => {
          if (!confirmed) {
            return new Observable<never>((subscriber) => subscriber.complete());
          }

          this.mutating.set(true);
          this.error.set(null);
          this.lastConfirmResult.set(null);

          if (action === 'confirm') {
            return this.tasksApi.confirm(task.id);
          }

          if (action === 'dismiss') {
            return this.tasksApi.dismiss(task.id);
          }

          if (action === 'complete') {
            return this.tasksApi.complete(task.id);
          }

          return this.tasksApi.skip(task.id);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          if (action === 'confirm') {
            this.lastConfirmResult.set(result as ConfirmTaskResult);
          }
          this.mutating.set(false);
          this.loadTask();
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.mutating.set(false);
        },
      });
  }

  private loadTask(): void {
    const taskId = this.route.snapshot.paramMap.get('taskId');

    if (taskId === null) {
      this.error.set(new ApiError('VALIDATION_ERROR', 'Task id is required.'));
      return;
    }

    this.loading.set(true);
    this.tasksApi
      .get(taskId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task) => {
          this.task.set(task);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }

  private confirmAction(action: TaskAction): Observable<boolean> {
    const data: Record<TaskAction, ConfirmDialogData> = {
      confirm: {
        title: 'Confirm suggested task',
        message: 'Confirm this suggestion as a planned task? Backend will create reminder rows.',
        confirmLabel: 'Confirm',
      },
      dismiss: {
        title: 'Dismiss suggestion',
        message: 'Dismiss this suggested task?',
        confirmLabel: 'Dismiss',
      },
      complete: {
        title: 'Mark task done',
        message: 'Mark this planned task as done?',
        confirmLabel: 'Done',
      },
      skip: {
        title: 'Skip task',
        message: 'Skip this planned task?',
        confirmLabel: 'Skip',
      },
    };

    return this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, { data: data[action] })
      .afterClosed()
      .pipe(map((confirmed) => confirmed === true));
  }
}
