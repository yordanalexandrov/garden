import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { buildQueryParams } from '../../core/api/query-params';
import {
  ConfirmTaskResult,
  CreateManualTaskRequest,
  ListTasksFilters,
  PatchTaskRequest,
  TaskDetail,
  TasksPage,
} from './tasks.models';

@Injectable({ providedIn: 'root' })
export class TasksApiService {
  private readonly api = inject(ApiClient);

  list(filters: ListTasksFilters = {}): Observable<TasksPage> {
    return this.api.get<TasksPage>('/tasks', {
      params: buildQueryParams(filters),
    });
  }

  create(request: CreateManualTaskRequest): Observable<TaskDetail> {
    return this.api.post<TaskDetail>('/tasks', request);
  }

  get(taskId: string): Observable<TaskDetail> {
    return this.api.get<TaskDetail>(`/tasks/${encodeURIComponent(taskId)}`);
  }

  update(taskId: string, request: PatchTaskRequest): Observable<TaskDetail> {
    return this.api.patch<TaskDetail>(`/tasks/${encodeURIComponent(taskId)}`, request);
  }

  confirm(taskId: string): Observable<ConfirmTaskResult> {
    return this.api.post<ConfirmTaskResult>(`/tasks/${encodeURIComponent(taskId)}/confirm`, {});
  }

  dismiss(taskId: string): Observable<TaskDetail> {
    return this.api.post<TaskDetail>(`/tasks/${encodeURIComponent(taskId)}/dismiss`, {});
  }

  complete(taskId: string): Observable<TaskDetail> {
    return this.api.post<TaskDetail>(`/tasks/${encodeURIComponent(taskId)}/complete`, {});
  }

  skip(taskId: string): Observable<TaskDetail> {
    return this.api.post<TaskDetail>(`/tasks/${encodeURIComponent(taskId)}/skip`, {});
  }
}
