import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { ApiListData } from '../../core/api/api.types';
import { buildQueryParams } from '../../core/api/query-params';
import { ArchiveResult, MutationResult } from '../garden-structure-api.types';
import {
  CreatePersistentBedPlantRequest,
  ListPersistentBedPlantsFilters,
  PersistentBedPlantListItem,
  UpdatePersistentBedPlantRequest,
} from './plantings.models';

@Injectable({ providedIn: 'root' })
export class PersistentBedPlantsApiService {
  private readonly api = inject(ApiClient);

  listByBed(
    bedId: string,
    filters: ListPersistentBedPlantsFilters = {},
  ): Observable<ApiListData<PersistentBedPlantListItem>> {
    return this.api.get<ApiListData<PersistentBedPlantListItem>>(
      `/beds/${encodeURIComponent(bedId)}/persistent-plants`,
      { params: buildQueryParams(filters) },
    );
  }

  create(bedId: string, request: CreatePersistentBedPlantRequest): Observable<MutationResult> {
    return this.api.post<MutationResult>(
      `/beds/${encodeURIComponent(bedId)}/persistent-plants`,
      request,
    );
  }

  update(id: string, request: UpdatePersistentBedPlantRequest): Observable<MutationResult> {
    return this.api.patch<MutationResult>(
      `/persistent-bed-plants/${encodeURIComponent(id)}`,
      request,
    );
  }

  archive(id: string): Observable<ArchiveResult> {
    return this.api.post<ArchiveResult>(
      `/persistent-bed-plants/${encodeURIComponent(id)}/archive`,
      {},
    );
  }
}
