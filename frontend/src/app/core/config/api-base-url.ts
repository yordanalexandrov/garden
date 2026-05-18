import { InjectionToken, Provider, inject } from '@angular/core';

import { FRONTEND_ENVIRONMENT } from './frontend-environment';

export const DEFAULT_API_BASE_URL = '/api/v1';

export const normalizeApiBaseUrl = (apiBaseUrl: string | null | undefined): string => {
  const trimmed = apiBaseUrl?.trim() ?? '';
  const value = trimmed.length > 0 ? trimmed : DEFAULT_API_BASE_URL;

  return value.endsWith('/') && value.length > 1 ? value.slice(0, -1) : value;
};

export const API_BASE_URL = new InjectionToken<string>('ApiBaseUrl', {
  providedIn: 'root',
  factory: () => normalizeApiBaseUrl(inject(FRONTEND_ENVIRONMENT).apiBaseUrl),
});

export const provideApiBaseUrl = (apiBaseUrl?: string): Provider => ({
  provide: API_BASE_URL,
  useFactory: () => normalizeApiBaseUrl(apiBaseUrl ?? inject(FRONTEND_ENVIRONMENT).apiBaseUrl),
});
