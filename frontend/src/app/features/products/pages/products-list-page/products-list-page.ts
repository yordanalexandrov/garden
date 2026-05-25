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
import { PRODUCT_CATEGORIES, ProductCategory, ProductListItem } from '../../products.models';
import { ProductsApiService } from '../../products-api.service';

type ProductFilterForm = FormGroup<{
  q: FormControl<string>;
  category: FormControl<ProductCategory | ''>;
  includeArchived: FormControl<boolean>;
}>;

@Component({
  selector: 'app-products-list-page',
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
  templateUrl: './products-list-page.html',
  styleUrl: './products-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListPage {
  readonly categories = PRODUCT_CATEGORIES;
  readonly products = signal<readonly ProductListItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<ApiError | null>(null);

  readonly filters: ProductFilterForm = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    category: new FormControl<ProductCategory | ''>('', { nonNullable: true }),
    includeArchived: new FormControl(false, { nonNullable: true }),
  });

  private readonly productsApi = inject(ProductsApiService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.search();
  }

  search(): void {
    const filters = this.filters.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.productsApi
      .list({
        q: filters.q.trim() || undefined,
        category: filters.category || undefined,
        includeArchived: filters.includeArchived,
        page: 1,
        pageSize: 20,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.products.set(result.items);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.loading.set(false);
        },
      });
  }
}

