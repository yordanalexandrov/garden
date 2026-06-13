import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { ProblemsApiService } from '../../problems-api.service';
import { ProblemDetail } from '../../problems.models';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-problem-detail-page',
  imports: [LoadingIndicator, ApiErrorSummary, DatePipe, MatCardModule, PageHeader, RouterLink],
  templateUrl: './problem-detail-page.html',
  styleUrl: './problem-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProblemDetailPage {
  readonly problem = signal<ProblemDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly problemsApi = inject(ProblemsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadProblem();
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
