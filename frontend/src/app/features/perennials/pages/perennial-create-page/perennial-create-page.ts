import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { PerennialForm } from '../../components/perennial-form/perennial-form';
import { UpdatePerennialRequest } from '../../perennials.models';
import { PerennialsApiService } from '../../perennials-api.service';

@Component({
  selector: 'app-perennial-create-page',
  imports: [MatCardModule, PageHeader, PerennialForm],
  templateUrl: './perennial-create-page.html',
  styleUrl: './perennial-create-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerennialCreatePage {
  readonly saving = signal(false);
  readonly apiError = signal<ApiError | null>(null);
  readonly placeId = signal<string | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly perennialsApi = inject(PerennialsApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.placeId.set(params.get('placeId'));
    });
  }

  savePerennial(request: UpdatePerennialRequest): void {
    const placeId = this.placeId();

    if (placeId === null || request.plantId === undefined) {
      return;
    }

    this.saving.set(true);
    this.apiError.set(null);

    this.perennialsApi
      .create(placeId, {
        plantId: request.plantId,
        label: request.label,
        plantedYear: request.plantedYear,
        notes: request.notes,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackbar.showMessage('Perennial created.');
          this.navigateBack(placeId);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.apiError.set(mapApiError(error));
        },
      });
  }

  cancel(): void {
    this.navigateBack(this.placeId());
  }

  private navigateBack(placeId: string | null): void {
    void this.router.navigate(placeId === null ? ['/places'] : ['/places', placeId, 'perennials']);
  }
}
