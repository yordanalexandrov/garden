import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from './api-client';

export interface HealthResponse {
  readonly status: 'ok';
  readonly timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class HealthApiService {
  private readonly api = inject(ApiClient);

  getHealth(): Observable<HealthResponse> {
    return this.api.get<HealthResponse>('/health');
  }
}
