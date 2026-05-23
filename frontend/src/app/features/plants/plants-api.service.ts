import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { ApiListData } from '../../core/api/api.types';
import { buildQueryParams } from '../../core/api/query-params';
import { ArchiveResult, MutationResult } from '../garden-structure-api.types';
import {
  CreatePlantRequest,
  ListPlantsFilters,
  PlantDetail,
  PlantListItem,
  UpdatePlantRequest,
} from './plants.models';

@Injectable({ providedIn: 'root' })
export class PlantsApiService {
  private readonly api = inject(ApiClient);

  list(filters: ListPlantsFilters = {}): Observable<ApiListData<PlantListItem>> {
    return this.api.get<ApiListData<PlantListItem>>('/plants', {
      params: buildQueryParams(filters),
    });
  }

  create(request: CreatePlantRequest): Observable<MutationResult> {
    return this.api.post<MutationResult>('/plants', request);
  }

  get(plantId: string): Observable<PlantDetail> {
    return this.api.get<PlantDetail>(`/plants/${encodeURIComponent(plantId)}`);
  }

  update(plantId: string, request: UpdatePlantRequest): Observable<MutationResult> {
    return this.api.patch<MutationResult>(`/plants/${encodeURIComponent(plantId)}`, request);
  }

  archive(plantId: string): Observable<ArchiveResult> {
    return this.api.post<ArchiveResult>(`/plants/${encodeURIComponent(plantId)}/archive`, {});
  }
}
