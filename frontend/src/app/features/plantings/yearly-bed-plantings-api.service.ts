import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { ApiListData } from '../../core/api/api.types';
import { buildQueryParams } from '../../core/api/query-params';
import { ArchiveResult, MutationResult } from '../garden-structure-api.types';
import {
  CreateYearlyBedPlantingRequest,
  ListYearlyBedPlantingsFilters,
  UpdateYearlyBedPlantingRequest,
  YearlyBedPlantingListItem,
} from './plantings.models';

@Injectable({ providedIn: 'root' })
export class YearlyBedPlantingsApiService {
  private readonly api = inject(ApiClient);

  listByBed(
    bedId: string,
    filters: ListYearlyBedPlantingsFilters = {},
  ): Observable<ApiListData<YearlyBedPlantingListItem>> {
    return this.api.get<ApiListData<YearlyBedPlantingListItem>>(
      `/beds/${encodeURIComponent(bedId)}/plantings`,
      { params: buildQueryParams(filters) },
    );
  }

  create(bedId: string, request: CreateYearlyBedPlantingRequest): Observable<MutationResult> {
    return this.api.post<MutationResult>(
      `/beds/${encodeURIComponent(bedId)}/plantings`,
      request,
    );
  }

  update(plantingId: string, request: UpdateYearlyBedPlantingRequest): Observable<MutationResult> {
    return this.api.patch<MutationResult>(
      `/plantings/${encodeURIComponent(plantingId)}`,
      request,
    );
  }

  archive(plantingId: string): Observable<ArchiveResult> {
    return this.api.post<ArchiveResult>(
      `/plantings/${encodeURIComponent(plantingId)}/archive`,
      {},
    );
  }
}
