import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiError } from '../../../../core/errors/api-error';
import { mapApiError } from '../../../../core/errors/api-error.mapper';
import { SnackbarService } from '../../../../core/notifications/snackbar.service';
import { PageHeader } from '../../../../shared/components/page-header/page-header';
import { ProductRuleForm } from '../../components/product-rule-form/product-rule-form';
import { CreateProductUsageRuleRequest } from '../../products.models';
import { ProductRulesApiService } from '../../products-api.service';

@Component({
  selector: 'app-product-rule-create-page',
  imports: [PageHeader, ProductRuleForm],
  templateUrl: './product-rule-create-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductRuleCreatePage {
  readonly saving = signal(false);
  readonly error = signal<ApiError | null>(null);

  private readonly rulesApi = inject(ProductRulesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  createRule(request: CreateProductUsageRuleRequest): void {
    const productId = this.route.snapshot.paramMap.get('productId');

    if (productId === null) {
      this.error.set(new ApiError('VALIDATION_ERROR', 'Product id is required.'));
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.rulesApi
      .create(productId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.showMessage('Usage rule saved.');
          void this.router.navigate(['/products', productId]);
        },
        error: (error: unknown) => {
          this.error.set(mapApiError(error));
          this.saving.set(false);
        },
      });
  }

  cancel(): void {
    const productId = this.route.snapshot.paramMap.get('productId');
    void this.router.navigate(productId ? ['/products', productId] : ['/products']);
  }
}

