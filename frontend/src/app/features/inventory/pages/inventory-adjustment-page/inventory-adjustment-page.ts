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
import { PRODUCT_UNITS, ProductListItem, ProductUnit } from '../../../products/products.models';
import { ProductsApiService } from '../../../products/products-api.service';
import {
  INVENTORY_ADJUSTMENT_DIRECTIONS,
  InventoryAdjustmentDirection,
  InventoryLot,
  ManualInventoryAdjustmentRequest,
} from '../../inventory.models';
import { InventoryApiService } from '../../inventory-api.service';

type AdjustmentFormGroup = FormGroup<{
  productId: FormControl<string>;
  inventoryLotId: FormControl<string>;
  quantity: FormControl<number>;
  unit: FormControl<ProductUnit>;
  movementType: FormControl<'manual_adjustment' | 'correction'>;
  direction: FormControl<InventoryAdjustmentDirection>;
  notes: FormControl<string>;
}>;

@Component({
  selector: 'app-inventory-adjustment-page',
  imports: [
    ApiErrorSummary,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
  ],
  templateUrl: './inventory-adjustment-page.html',
  styleUrl: './inventory-adjustment-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryAdjustmentPage {
  readonly units = PRODUCT_UNITS;
  readonly directions = INVENTORY_ADJUSTMENT_DIRECTIONS;
  readonly products = signal<readonly ProductListItem[]>([]);
  readonly lots = signal<readonly InventoryLot[]>([]);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  readonly form: AdjustmentFormGroup = new FormGroup({
    productId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    inventoryLotId: new FormControl('', { nonNullable: true }),
    quantity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.000001)] }),
    unit: new FormControl<ProductUnit>('g', { nonNullable: true }),
    movementType: new FormControl<'manual_adjustment' | 'correction'>('manual_adjustment', { nonNullable: true }),
    direction: new FormControl<InventoryAdjustmentDirection>('increase', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsApi = inject(ProductsApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadProducts();

    const productId = this.route.snapshot.queryParamMap.get('productId');
    if (productId !== null) {
      this.form.controls.productId.setValue(productId);
      this.loadLots(productId);
    }
  }

  productChanged(productId: string): void {
    this.form.controls.inventoryLotId.setValue('');
    this.loadLots(productId);
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const request = toAdjustmentRequest(this.form.getRawValue());
    this.saving.set(true);
    this.error.set(null);

    this.inventoryApi
      .adjustStock(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.showMessage('Inventory adjustment recorded.');
          void this.router.navigate(['/inventory/products', request.productId]);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.saving.set(false);
        },
      });
  }

  cancel(): void {
    const productId = this.form.controls.productId.value;
    void this.router.navigate(productId ? ['/inventory/products', productId] : ['/inventory']);
  }

  private loadProducts(): void {
    this.productsApi
      .list({ page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.products.set(result.items),
        error: (error: unknown) => this.error.set(mapApiError(error)),
      });
  }

  private loadLots(productId: string): void {
    if (productId.trim().length === 0) {
      this.lots.set([]);
      return;
    }

    this.inventoryApi
      .listLots(productId, { page: 1, pageSize: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.lots.set(result.items),
        error: (error: unknown) => this.error.set(mapApiError(error)),
      });
  }
}

const toAdjustmentRequest = (value: AdjustmentFormGroup['value']): ManualInventoryAdjustmentRequest => ({
  productId: value.productId ?? '',
  inventoryLotId: nullableText(value.inventoryLotId),
  quantity: Number(value.quantity),
  unit: value.unit ?? 'g',
  movementType: value.movementType ?? 'manual_adjustment',
  direction: value.direction ?? 'increase',
  notes: nullableText(value.notes),
});

const nullableText = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? '').trim();

  return trimmed.length > 0 ? trimmed : null;
};

