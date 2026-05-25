import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PRODUCT_UNITS, ProductUnit } from '../../../products/products.models';
import { CreateInventoryLotRequest } from '../../inventory.models';
import { InventoryApiService } from '../../inventory-api.service';

type LotFormGroup = FormGroup<{
  quantityInitial: FormControl<number>;
  unit: FormControl<ProductUnit>;
  purchaseDate: FormControl<string>;
  expiryDate: FormControl<string>;
  batchNumber: FormControl<string>;
  notes: FormControl<string>;
}>;

@Component({
  selector: 'app-inventory-lot-create-page',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
  ],
  templateUrl: './inventory-lot-create-page.html',
  styleUrl: './inventory-lot-create-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryLotCreatePage {
  readonly units = PRODUCT_UNITS;
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  readonly form: LotFormGroup = new FormGroup({
    quantityInitial: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.000001)] }),
    unit: new FormControl<ProductUnit>('g', { nonNullable: true }),
    purchaseDate: new FormControl('', { nonNullable: true }),
    expiryDate: new FormControl('', { nonNullable: true }),
    batchNumber: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  submit(): void {
    const productId = this.route.snapshot.paramMap.get('productId');

    if (productId === null) {
      this.error.set(new ApiError('VALIDATION_ERROR', 'Product id is required.'));
      return;
    }

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.inventoryApi
      .createLot(productId, toCreateLotRequest(this.form.getRawValue()))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.showMessage('Inventory lot added.');
          void this.router.navigate(['/inventory/products', productId]);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.saving.set(false);
        },
      });
  }

  cancel(): void {
    const productId = this.route.snapshot.paramMap.get('productId');
    void this.router.navigate(productId ? ['/inventory/products', productId] : ['/inventory']);
  }
}

const toCreateLotRequest = (value: LotFormGroup['value']): CreateInventoryLotRequest => ({
  quantityInitial: Number(value.quantityInitial),
  unit: value.unit ?? 'g',
  purchaseDate: nullableText(value.purchaseDate),
  expiryDate: nullableText(value.expiryDate),
  batchNumber: nullableText(value.batchNumber),
  notes: nullableText(value.notes),
});

const nullableText = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? '').trim();

  return trimmed.length > 0 ? trimmed : null;
};

