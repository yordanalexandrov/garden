import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { ApiListData } from '../../core/api/api.types';
import { buildQueryParams } from '../../core/api/query-params';
import { ArchiveResult, MutationResult } from '../garden-structure-api.types';
import {
  CreateProductRequest,
  CreateProductUsageRuleRequest,
  ListProductsFilters,
  ProductDetail,
  ProductListItem,
  ProductUsageRule,
  ProductUsageRuleDetail,
  UpdateProductRequest,
  UpdateProductUsageRuleRequest,
} from './products.models';

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly api = inject(ApiClient);

  list(filters: ListProductsFilters = {}): Observable<ApiListData<ProductListItem>> {
    return this.api.get<ApiListData<ProductListItem>>('/products', {
      params: buildQueryParams(filters),
    });
  }

  create(request: CreateProductRequest): Observable<MutationResult> {
    return this.api.post<MutationResult>('/products', request);
  }

  get(productId: string): Observable<ProductDetail> {
    return this.api.get<ProductDetail>(`/products/${encodeURIComponent(productId)}`);
  }

  update(productId: string, request: UpdateProductRequest): Observable<MutationResult> {
    return this.api.patch<MutationResult>(`/products/${encodeURIComponent(productId)}`, request);
  }

  archive(productId: string): Observable<ArchiveResult> {
    return this.api.post<ArchiveResult>(`/products/${encodeURIComponent(productId)}/archive`, {});
  }
}

@Injectable({ providedIn: 'root' })
export class ProductRulesApiService {
  private readonly api = inject(ApiClient);

  listByProduct(productId: string): Observable<{ readonly items: readonly ProductUsageRule[] }> {
    return this.api.get<{ readonly items: readonly ProductUsageRule[] }>(
      `/products/${encodeURIComponent(productId)}/rules`,
    );
  }

  create(productId: string, request: CreateProductUsageRuleRequest): Observable<MutationResult> {
    return this.api.post<MutationResult>(
      `/products/${encodeURIComponent(productId)}/rules`,
      request,
    );
  }

  get(ruleId: string): Observable<ProductUsageRuleDetail> {
    return this.api.get<ProductUsageRuleDetail>(`/product-rules/${encodeURIComponent(ruleId)}`);
  }

  update(ruleId: string, request: UpdateProductUsageRuleRequest): Observable<MutationResult> {
    return this.api.patch<MutationResult>(`/product-rules/${encodeURIComponent(ruleId)}`, request);
  }

  archive(ruleId: string): Observable<ArchiveResult> {
    return this.api.post<ArchiveResult>(`/product-rules/${encodeURIComponent(ruleId)}/archive`, {});
  }
}

