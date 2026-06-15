import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { BedForm } from '../../components/bed-form/bed-form';
import { UpdateBedRequest } from '../../beds.models';
import { BedsApiService } from '../../beds-api.service';

@Component({
  selector: 'app-bed-create-page',
  imports: [MatCardModule, PageHeader, BedForm],
  templateUrl: './bed-create-page.html',
  styleUrl: './bed-create-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BedCreatePage {
  readonly saving = signal(false);
  readonly apiError = signal<ApiError | null>(null);
  readonly placeId = signal<string | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bedsApi = inject(BedsApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.parent?.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.placeId.set(params.get('placeId'));
    });
  }

  saveBed(request: UpdateBedRequest): void {
    const placeId = this.placeId();

    if (placeId === null || request.name === undefined) {
      return;
    }

    this.saving.set(true);
    this.apiError.set(null);

    this.bedsApi
      .create(placeId, {
        name: request.name,
        description: request.description,
        notes: request.notes,
        widthM: request.widthM,
        lengthM: request.lengthM,
        areaM2: request.areaM2,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.snackbar.showMessage('Bed created.');
          void this.router.navigate(['/beds', result.id]);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.apiError.set(mapApiError(error));
        },
      });
  }

  cancel(): void {
    const placeId = this.placeId();
    void this.router.navigate(placeId === null ? ['/places'] : ['/places', placeId, 'beds']);
  }
}
