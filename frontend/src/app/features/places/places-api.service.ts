import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { ApiListData } from '../../core/api/api.types';
import { buildQueryParams } from '../../core/api/query-params';
import { ArchiveResult } from '../garden-structure-api.types';
import {
  CreatePlaceRequest,
  ListPlacesFilters,
  PlaceDetail,
  PlaceListItem,
  PlaceMutationResult,
  UpdatePlaceRequest,
} from './places.models';

@Injectable({ providedIn: 'root' })
export class PlacesApiService {
  private readonly api = inject(ApiClient);

  list(filters: ListPlacesFilters = {}): Observable<ApiListData<PlaceListItem>> {
    return this.api.get<ApiListData<PlaceListItem>>('/places', {
      params: buildQueryParams(filters),
    });
  }

  create(request: CreatePlaceRequest): Observable<PlaceMutationResult> {
    return this.api.post<PlaceMutationResult>('/places', request);
  }

  get(placeId: string): Observable<PlaceDetail> {
    return this.api.get<PlaceDetail>(`/places/${encodeURIComponent(placeId)}`);
  }

  update(placeId: string, request: UpdatePlaceRequest): Observable<PlaceMutationResult> {
    return this.api.patch<PlaceMutationResult>(
      `/places/${encodeURIComponent(placeId)}`,
      request,
    );
  }

  archive(placeId: string): Observable<ArchiveResult> {
    return this.api.post<ArchiveResult>(`/places/${encodeURIComponent(placeId)}/archive`, {});
  }
}
