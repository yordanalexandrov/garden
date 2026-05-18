import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../config/api-base-url';
import { ApiError } from '../errors/api-error';
import { ApiSuccessEnvelope } from './api.types';
import { joinApiUrl } from './api-url';

type PrimitiveQueryValue = string | number | boolean;

export interface ApiRequestOptions {
  readonly headers?: HttpHeaders | Record<string, string | string[]>;
  readonly params?:
    | HttpParams
    | Record<string, PrimitiveQueryValue | PrimitiveQueryValue[]>;
}

export interface ApiRequestWithBodyOptions extends ApiRequestOptions {
  readonly body?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  get<TData>(path: string, options: ApiRequestOptions = {}): Observable<TData> {
    return this.request<TData>('GET', path, options);
  }

  post<TData>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<TData> {
    return this.request<TData>('POST', path, { ...options, body });
  }

  patch<TData>(path: string, body: unknown, options: ApiRequestOptions = {}): Observable<TData> {
    return this.request<TData>('PATCH', path, { ...options, body });
  }

  delete<TData>(path: string, options: ApiRequestOptions = {}): Observable<TData> {
    return this.request<TData>('DELETE', path, options);
  }

  private request<TData>(
    method: string,
    path: string,
    options: ApiRequestWithBodyOptions = {},
  ): Observable<TData> {
    return this.http
      .request<unknown>(method, joinApiUrl(this.apiBaseUrl, path), {
        body: options.body,
        headers: options.headers,
        params: options.params,
      })
      .pipe(map((response) => unwrapDataEnvelope<TData>(response)));
  }
}

export const unwrapDataEnvelope = <TData>(response: unknown): TData => {
  if (isSuccessEnvelope<TData>(response)) {
    return response.data;
  }

  throw new ApiError('INTERNAL_ERROR', 'API response did not match the expected data envelope.');
};

const isSuccessEnvelope = <TData>(value: unknown): value is ApiSuccessEnvelope<TData> =>
  typeof value === 'object' && value !== null && 'data' in value;
