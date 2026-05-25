import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ApiErrorSummary } from '../../../../shared/forms/api-error-summary/api-error-summary';
import { PRODUCT_CATEGORIES, ProductCategory } from '../../../products/products.models';
import { InventoryOverviewItem } from '../../inventory.models';
import { InventoryApiService } from '../../inventory-api.service';

type InventoryFilterForm = FormGroup<{
  q: FormControl<string>;
  category: FormControl<ProductCategory | ''>;
  lowStockOnly: FormControl<boolean>;
  expiringBefore: FormControl<string>;
}>;

@Component({
  selector: 'app-inventory-overview-page',
  imports: [
    ApiErrorSummary,
    EmptyState,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    PageHeader,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './inventory-overview-page.html',
  styleUrl: './inventory-overview-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryOverviewPage {
  readonly categories = PRODUCT_CATEGORIES;
  readonly items = signal<readonly InventoryOverviewItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  readonly filters: InventoryFilterForm = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    category: new FormControl<ProductCategory | ''>('', { nonNullable: true }),
    lowStockOnly: new FormControl(false, { nonNullable: true }),
    expiringBefore: new FormControl('', { nonNullable: true }),
  });

  private readonly inventoryApi = inject(InventoryApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.search();
  }

  search(): void {
    const filters = this.filters.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.inventoryApi
      .list({
        q: filters.q.trim() || undefined,
        category: filters.category || undefined,
        lowStockOnly: filters.lowStockOnly,
        expiringBefore: filters.expiringBefore || undefined,
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}

