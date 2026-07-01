import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ProblemPhotoGallery } from '../../../../shared/components/problem-photo-gallery/problem-photo-gallery';
import { ProblemPhotoUploader } from '../../../../shared/components/problem-photo-uploader/problem-photo-uploader';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';
import {
  ObservationDialog,
  ObservationDialogData,
  ObservationDialogResult,
} from '../../../../shared/components/observation-dialog/observation-dialog';
import { ProblemsApiService } from '../../problems-api.service';
import { ProblemDetail, ProblemObservation } from '../../problems.models';

@Component({
  selector: 'app-problem-detail-page',
  imports: [
    LoadingIndicator,
    ApiErrorSummary,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    PageHeader,
    ProblemPhotoGallery,
    ProblemPhotoUploader,
    RouterLink,
  ],
  templateUrl: './problem-detail-page.html',
  styleUrl: './problem-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemDetailPage {
  readonly problem = signal<ProblemDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);
  readonly uploading = signal(false);
  readonly resolving = signal(false);

  readonly uploader = viewChild(ProblemPhotoUploader);

  private readonly problemsApi = inject(ProblemsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  constructor() {
    this.loadProblem();
  }

  uploadPhotos(): void {
    const problem = this.problem();
    const uploader = this.uploader();

    if (!problem || !uploader || !uploader.hasFiles() || this.uploading()) {
      return;
    }

    this.uploading.set(true);

    uploader
      .upload(problem.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.uploading.set(false);
        this.loadProblem();
      });
  }

  resolve(): void {
    const problem = this.problem();
    if (!problem || this.resolving()) return;
    this.error.set(null);
    this.resolving.set(true);
    this.problemsApi
      .resolve(problem.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resolving.set(false);
          this.loadProblem();
        },
        error: (err) => {
          this.error.set(mapApiError(err));
          this.resolving.set(false);
        },
      });
  }

  reopen(): void {
    const problem = this.problem();
    if (!problem || this.resolving()) return;
    this.error.set(null);
    this.resolving.set(true);
    this.problemsApi
      .reopen(problem.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resolving.set(false);
          this.loadProblem();
        },
        error: (err) => {
          this.error.set(mapApiError(err));
          this.resolving.set(false);
        },
      });
  }

  addObservation(): void {
    const problem = this.problem();
    if (!problem) return;
    this.error.set(null);

    this.dialog
      .open<ObservationDialog, ObservationDialogData, ObservationDialogResult>(ObservationDialog, {
        data: {},
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((result) => {
          if (!result) return EMPTY;
          return this.problemsApi.addObservation(problem.id, {
            summary: result.summary,
            recommendation: result.recommendation,
          });
        }),
        catchError((err) => {
          this.error.set(mapApiError(err));
          return EMPTY;
        }),
      )
      .subscribe(() => this.loadProblem());
  }

  editObservation(obs: ProblemObservation): void {
    const problem = this.problem();
    if (!problem) return;
    this.error.set(null);

    this.dialog
      .open<ObservationDialog, ObservationDialogData, ObservationDialogResult>(ObservationDialog, {
        data: { existing: obs },
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((result) => {
          if (!result) return EMPTY;
          return this.problemsApi.updateObservation(problem.id, obs.id, {
            summary: result.summary,
            recommendation: result.recommendation,
          });
        }),
        catchError((err) => {
          this.error.set(mapApiError(err));
          return EMPTY;
        }),
      )
      .subscribe(() => this.loadProblem());
  }

  archiveObservation(obs: ProblemObservation): void {
    const problem = this.problem();
    if (!problem) return;
    this.error.set(null);

    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: 'Архивирай наблюдение',
          message: 'Сигурен ли си, че искаш да архивираш това наблюдение?',
          confirmLabel: 'Архивирай',
        },
      })
      .afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((confirmed) => {
          if (!confirmed) return EMPTY;
          return this.problemsApi.archiveObservation(problem.id, obs.id);
        }),
        catchError((err) => {
          this.error.set(mapApiError(err));
          return EMPTY;
        }),
      )
      .subscribe(() => this.loadProblem());
  }

  private loadProblem(): void {
    const problemId = this.route.snapshot.paramMap.get('problemId');

    if (!problemId) {
      return;
    }

    this.loading.set(true);
    this.problemsApi
      .get(problemId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (problem) => {
          this.problem.set(problem);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
