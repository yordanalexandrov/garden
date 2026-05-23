import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { ApiListData } from '../../core/api/api.types';
import { buildQueryParams } from '../../core/api/query-params';
import { ArchiveResult, MutationResult } from '../garden-structure-api.types';
import {
  BedDetail,
  BedListItem,
  CreateBedRequest,
  ListBedsFilters,
  UpdateBedRequest,
} from './beds.models';

@Injectable({ providedIn: 'root' })
export class BedsApiService {
  private readonly api = inject(ApiClient);

  listByPlace(placeId: string, filters: ListBedsFilters = {}): Observable<ApiListData<BedListItem>> {
    return this.api.get<ApiListData<BedListItem>>(
      `/places/${encodeURIComponent(placeId)}/beds`,
      { params: buildQueryParams(filters) },
    );
  }

  create(placeId: string, request: CreateBedRequest): Observable<MutationResult> {
    return this.api.post<MutationResult>(`/places/${encodeURIComponent(placeId)}/beds`, request);
  }

  get(bedId: string, year?: number): Observable<BedDetail> {
    return this.api.get<BedDetail>(`/beds/${encodeURIComponent(bedId)}`, {
      params: buildQueryParams({ year }),
    });
  }

  update(bedId: string, request: UpdateBedRequest): Observable<MutationResult> {
    return this.api.patch<MutationResult>(`/beds/${encodeURIComponent(bedId)}`, request);
  }

  archive(bedId: string): Observable<ArchiveResult> {
    return this.api.post<ArchiveResult>(`/beds/${encodeURIComponent(bedId)}/archive`, {});
  }
}
