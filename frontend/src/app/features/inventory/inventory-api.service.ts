import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { buildQueryParams } from '../../core/api/query-params';
import {
  CreateInventoryLotRequest,
  CreateInventoryLotResult,
  InventoryLotsData,
  InventoryMovementsData,
  InventoryOverviewData,
  ListInventoryFilters,
  ListInventoryLotsFilters,
  ListInventoryMovementsFilters,
  ManualInventoryAdjustmentRequest,
  ManualInventoryAdjustmentResult,
} from './inventory.models';

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly api = inject(ApiClient);

  list(filters: ListInventoryFilters = {}): Observable<InventoryOverviewData> {
    return this.api.get<InventoryOverviewData>('/inventory', {
      params: buildQueryParams(filters),
    });
  }

  listLots(productId: string, filters: ListInventoryLotsFilters = {}): Observable<InventoryLotsData> {
    return this.api.get<InventoryLotsData>(
      `/products/${encodeURIComponent(productId)}/inventory-lots`,
      { params: buildQueryParams(filters) },
    );
  }

  createLot(
    productId: string,
    request: CreateInventoryLotRequest,
  ): Observable<CreateInventoryLotResult> {
    return this.api.post<CreateInventoryLotResult>(
      `/products/${encodeURIComponent(productId)}/inventory-lots`,
      request,
    );
  }

  listMovements(
    productId: string,
    filters: ListInventoryMovementsFilters = {},
  ): Observable<InventoryMovementsData> {
    return this.api.get<InventoryMovementsData>(
      `/products/${encodeURIComponent(productId)}/inventory-movements`,
      { params: buildQueryParams(filters) },
    );
  }

  adjustStock(
    request: ManualInventoryAdjustmentRequest,
  ): Observable<ManualInventoryAdjustmentResult> {
    return this.api.post<ManualInventoryAdjustmentResult>('/inventory/adjustments', request);
  }
}

