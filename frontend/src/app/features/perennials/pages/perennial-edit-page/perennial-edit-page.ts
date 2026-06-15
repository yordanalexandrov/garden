import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PerennialForm } from '../../components/perennial-form/perennial-form';
import { PerennialDetail, UpdatePerennialRequest } from '../../perennials.models';
import { PerennialsApiService } from '../../perennials-api.service';

@Component({
  selector: 'app-perennial-edit-page',
  imports: [
    ApiErrorSummary,
    LoadingIndicator,
    MatButtonModule,
    MatCardModule,
    PageHeader,
    PerennialForm,
    RouterLink,
  ],
  templateUrl: './perennial-edit-page.html',
  styleUrl: './perennial-edit-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerennialEditPage {
  readonly perennial = signal<PerennialDetail | null>(null);
  readonly perennialId = signal<string | null>(null);
  readonly placeId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly apiError = signal<ApiError | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly perennialsApi = inject(PerennialsApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.placeId.set(params.get('placeId'));
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const perennialId = params.get('perennialId');
      this.perennialId.set(perennialId);

      if (perennialId !== null) {
        this.loadPerennial(perennialId);
      }
    });
  }

  savePerennial(request: UpdatePerennialRequest): void {
    const perennialId = this.perennialId();

    if (perennialId === null) {
      return;
    }

    this.saving.set(true);
    this.apiError.set(null);

    this.perennialsApi
      .update(perennialId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.showMessage('Perennial updated.');
          this.navigateBack();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.apiError.set(mapApiError(error));
        },
      });
  }

  cancel(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    const placeId = this.placeId();
    void this.router.navigate(placeId === null ? ['/places'] : ['/places', placeId, 'perennials']);
  }

  private loadPerennial(perennialId: string): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.perennialsApi
      .get(perennialId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (perennial) => {
          this.perennial.set(perennial);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.apiError.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}
