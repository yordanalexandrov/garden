import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { buildQueryParams } from '../../core/api/query-params';
import { DashboardQuery, DashboardSummary } from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly api = inject(ApiClient);

  getDashboard(query: DashboardQuery = {}): Observable<DashboardSummary> {
    return this.api.get<DashboardSummary>('/dashboard', {
      params: buildQueryParams(query),
    });
  }
}
