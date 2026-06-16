import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { buildQueryParams } from '../../core/api/query-params';
import { ArchiveResult } from '../garden-structure-api.types';
import {
  ActivitiesPage,
  ActivityDetail,
  CreateActivityRequest,
  CreateActivityResult,
  ListActivitiesFilters,
} from './activities.models';

@Injectable({ providedIn: 'root' })
export class ActivitiesApiService {
  private readonly api = inject(ApiClient);

  list(filters: ListActivitiesFilters = {}): Observable<ActivitiesPage> {
    return this.api.get<ActivitiesPage>('/activities', {
      params: buildQueryParams(filters),
    });
  }

  get(activityId: string): Observable<ActivityDetail> {
    return this.api.get<ActivityDetail>(`/activities/${encodeURIComponent(activityId)}`);
  }

  create(request: CreateActivityRequest): Observable<CreateActivityResult> {
    return this.api.post<CreateActivityResult>('/activities', request);
  }

  archive(activityId: string): Observable<ArchiveResult> {
    return this.api.post<ArchiveResult>(`/activities/${encodeURIComponent(activityId)}/archive`, {});
  }
}

