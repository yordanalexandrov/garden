import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ProductForm } from '../../components/product-form/product-form';
import { CreateProductRequest, ProductDetail } from '../../products.models';
import { ProductsApiService } from '../../products-api.service';

@Component({
  selector: 'app-product-edit-page',
  imports: [PageHeader, ProductForm],
  templateUrl: './product-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductEditPage {
  readonly product = signal<ProductDetail | null>(null);
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly productsApi = inject(ProductsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadProduct();
  }

  updateProduct(request: CreateProductRequest): void {
    const product = this.product();

    if (product === null) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.productsApi
      .update(product.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.showMessage('Product updated.');
          void this.router.navigate(['/products', product.id]);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.saving.set(false);
        },
      });
  }

  cancel(): void {
    const productId = this.product()?.id;
    void this.router.navigate(productId ? ['/products', productId] : ['/products']);
  }

  private loadProduct(): void {
    const productId = this.route.snapshot.paramMap.get('productId');

    if (productId === null) {
      this.error.set(new ApiError('VALIDATION_ERROR', 'Product id is required.'));
      return;
    }

    this.productsApi
      .get(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => this.product.set(product),
        error: (error: unknown) => this.error.set(mapApiError(error)),
      });
  }
}

