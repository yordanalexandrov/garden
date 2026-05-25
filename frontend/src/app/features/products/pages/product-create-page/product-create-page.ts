import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ProductForm } from '../../components/product-form/product-form';
import { CreateProductRequest } from '../../products.models';
import { ProductsApiService } from '../../products-api.service';

@Component({
  selector: 'app-product-create-page',
  imports: [PageHeader, ProductForm],
  templateUrl: './product-create-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCreatePage {
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly productsApi = inject(ProductsApiService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  createProduct(request: CreateProductRequest): void {
    this.saving.set(true);
    this.error.set(null);

    this.productsApi
      .create(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.snackbar.showMessage('Product saved.');
          void this.router.navigate(['/products', result.id]);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.saving.set(false);
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/products']);
  }
}

