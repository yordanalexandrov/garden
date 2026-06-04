import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { buildQueryParams } from '../../core/api/query-params';
import {
  CreateProblemRequest,
  ListProblemsFilters,
  ProblemDetail,
  ProblemMutationResult,
  ProblemPhotoMutationResult,
  ProblemsPage,
  UpdateProblemRequest,
} from './problems.models';

@Injectable({ providedIn: 'root' })
export class ProblemsApiService {
  private readonly api = inject(ApiClient);

  list(filters: ListProblemsFilters = {}): Observable<ProblemsPage> {
    return this.api.get<ProblemsPage>('/problems', {
      params: buildQueryParams(filters),
    });
  }

  get(problemId: string): Observable<ProblemDetail> {
    return this.api.get<ProblemDetail>(`/problems/${encodeURIComponent(problemId)}`);
  }

  create(request: CreateProblemRequest): Observable<ProblemMutationResult> {
    return this.api.post<ProblemMutationResult>('/problems', request);
  }

  update(problemId: string, request: UpdateProblemRequest): Observable<ProblemMutationResult> {
    return this.api.patch<ProblemMutationResult>(
      `/problems/${encodeURIComponent(problemId)}`,
      request,
    );
  }

  uploadPhoto(problemId: string, file: File): Observable<ProblemPhotoMutationResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.post<ProblemPhotoMutationResult>(
      `/problems/${encodeURIComponent(problemId)}/photos`,
      formData,
    );
  }
}
