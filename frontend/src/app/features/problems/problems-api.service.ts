import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { buildQueryParams } from '../../core/api/query-params';
import {
  CreateObservationRequest,
  CreateProblemRequest,
  ListProblemsFilters,
  ProblemDetail,
  ProblemMutationResult,
  ProblemObservation,
  ProblemPhotoMutationResult,
  ProblemsPage,
  UpdateObservationRequest,
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

  addObservation(problemId: string, request: CreateObservationRequest): Observable<ProblemObservation> {
    return this.api.post<ProblemObservation>(
      `/problems/${encodeURIComponent(problemId)}/observations`,
      request,
    );
  }

  updateObservation(problemId: string, obsId: string, request: UpdateObservationRequest): Observable<ProblemObservation> {
    return this.api.patch<ProblemObservation>(
      `/problems/${encodeURIComponent(problemId)}/observations/${encodeURIComponent(obsId)}`,
      request,
    );
  }

  deleteObservation(problemId: string, obsId: string): Observable<void> {
    return this.api.delete<void>(
      `/problems/${encodeURIComponent(problemId)}/observations/${encodeURIComponent(obsId)}`,
    );
  }

  resolve(problemId: string): Observable<ProblemMutationResult> {
    return this.api.post<ProblemMutationResult>(
      `/problems/${encodeURIComponent(problemId)}/resolve`,
      {},
    );
  }

  reopen(problemId: string): Observable<ProblemMutationResult> {
    return this.api.post<ProblemMutationResult>(
      `/problems/${encodeURIComponent(problemId)}/reopen`,
      {},
    );
  }
}
