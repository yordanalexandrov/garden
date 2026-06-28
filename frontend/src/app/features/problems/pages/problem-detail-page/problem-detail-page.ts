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
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { ProblemPhotoGallery } from '../../../../shared/components/problem-photo-gallery/problem-photo-gallery';
import { ProblemPhotoUploader } from '../../../../shared/components/problem-photo-uploader/problem-photo-uploader';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { ProblemsApiService } from '../../problems-api.service';
import { ProblemDetail } from '../../problems.models';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-problem-detail-page',
  imports: [
    LoadingIndicator,
    ApiErrorSummary,
    DatePipe,
    MatButtonModule,
    MatCardModule,
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

  readonly uploader = viewChild(ProblemPhotoUploader);

  private readonly problemsApi = inject(ProblemsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

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
