import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { ApiListData } from '../../core/api/api.types';
import { buildQueryParams } from '../../core/api/query-params';
import { ArchiveResult, MutationResult } from '../garden-structure-api.types';
import {
  CreatePerennialRequest,
  ListPerennialsFilters,
  PerennialDetail,
  PerennialListItem,
  UpdatePerennialRequest,
} from './perennials.models';

@Injectable({ providedIn: 'root' })
export class PerennialsApiService {
  private readonly api = inject(ApiClient);

  listByPlace(
    placeId: string,
    filters: ListPerennialsFilters = {},
  ): Observable<ApiListData<PerennialListItem>> {
    return this.api.get<ApiListData<PerennialListItem>>(
      `/places/${encodeURIComponent(placeId)}/perennials`,
      { params: buildQueryParams(filters) },
    );
  }

  create(placeId: string, request: CreatePerennialRequest): Observable<MutationResult> {
    return this.api.post<MutationResult>(
      `/places/${encodeURIComponent(placeId)}/perennials`,
      request,
    );
  }

  get(perennialId: string): Observable<PerennialDetail> {
    return this.api.get<PerennialDetail>(`/perennials/${encodeURIComponent(perennialId)}`);
  }

  update(perennialId: string, request: UpdatePerennialRequest): Observable<MutationResult> {
    return this.api.patch<MutationResult>(
      `/perennials/${encodeURIComponent(perennialId)}`,
      request,
    );
  }

  archive(perennialId: string): Observable<ArchiveResult> {
    return this.api.post<ArchiveResult>(
      `/perennials/${encodeURIComponent(perennialId)}/archive`,
      {},
    );
  }
}
