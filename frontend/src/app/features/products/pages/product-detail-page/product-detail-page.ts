import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import {
  AiProductRulesDialog,
  AiProductRulesDialogData,
} from '../../../ai/components/ai-product-rules-dialog/ai-product-rules-dialog';
import { ArchiveConfirmationService } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { InventoryLot, InventoryMovement } from '../../../inventory/inventory.models';
import { InventoryApiService } from '../../../inventory/inventory-api.service';
import { ProductDetail, ProductUsageRule } from '../../products.models';
import { ProductRulesApiService, ProductsApiService } from '../../products-api.service';
import { LoadingIndicator } from '../../../../shared/components/loading-indicator/loading-indicator';

@Component({
  selector: 'app-product-detail-page',
  imports: [LoadingIndicator, ApiErrorSummary, MatButtonModule, MatCardModule, MatIconModule, PageHeader, RouterLink],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage {
  readonly product = signal<ProductDetail | null>(null);
  readonly rules = signal<readonly ProductUsageRule[]>([]);
  readonly lots = signal<readonly InventoryLot[]>([]);
  readonly movements = signal<readonly InventoryMovement[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly productsApi = inject(ProductsApiService);
  private readonly rulesApi = inject(ProductRulesApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly archiveConfirmation = inject(ArchiveConfirmationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  generateRulesWithAi(): void {
    const product = this.product();

    if (product === null) {
      return;
    }

    this.dialog
      .open<AiProductRulesDialog, AiProductRulesDialogData, void>(AiProductRulesDialog, {
        data: { productId: product.id, productName: product.name },
        autoFocus: false,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Rules may have been created or refreshed during the dialog session.
        this.load();
      });
  }

  archiveProduct(): void {
    const product = this.product();

    if (product === null) {
      return;
    }

    this.archiveConfirmation
      .confirmArchive(product.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.productsApi
          .archive(product.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.load(),
            error: (error: unknown) => this.error.set(mapApiError(error)),
          });
      });
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
      rules: this.rulesApi.listByProduct(productId),
      lots: this.inventoryApi.listLots(productId, { page: 1, pageSize: 100 }),
      movements: this.inventoryApi.listMovements(productId, { page: 1, pageSize: 50 }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ product, rules, lots, movements }) => {
          this.product.set(product);
          this.rules.set(rules.items);
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

