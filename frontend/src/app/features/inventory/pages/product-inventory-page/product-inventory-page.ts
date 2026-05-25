import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { ProductDetail } from '../../../products/products.models';
import { ProductsApiService } from '../../../products/products-api.service';
import { InventoryLot, InventoryMovement } from '../../inventory.models';
import { InventoryApiService } from '../../inventory-api.service';

@Component({
  selector: 'app-product-inventory-page',
  imports: [ApiErrorSummary, MatButtonModule, MatCardModule, MatIconModule, PageHeader, RouterLink],
  templateUrl: './product-inventory-page.html',
  styleUrl: './product-inventory-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductInventoryPage {
  readonly product = signal<ProductDetail | null>(null);
  readonly lots = signal<readonly InventoryLot[]>([]);
  readonly movements = signal<readonly InventoryMovement[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly route = inject(ActivatedRoute);
  private readonly productsApi = inject(ProductsApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  private load(): void {
    const productId = this.route.snapshot.paramMap.get('productId');

    if (productId === null) {
      this.error.set(new ApiError('VALIDATION_ERROR', 'Product id is required.'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      product: this.productsApi.get(productId),
      lots: this.inventoryApi.listLots(productId, { page: 1, pageSize: 100 }),
      movements: this.inventoryApi.listMovements(productId, { page: 1, pageSize: 100 }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ product, lots, movements }) => {
          this.product.set(product);
          this.lots.set(lots.items);
          this.movements.set(movements.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}

