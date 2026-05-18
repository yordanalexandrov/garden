import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { isApiRequestUrl } from '../api/api-url';
import { API_BASE_URL } from '../config/api-base-url';
import { formatApiErrorForDisplay, mapApiError } from '../errors/api-error.mapper';
import { SnackbarService } from '../notifications/snackbar.service';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBaseUrl = inject(API_BASE_URL);

  if (!isApiRequestUrl(request.url, apiBaseUrl)) {
    return next(request);
  }

  const snackbar = inject(SnackbarService);

  return next(request).pipe(
    catchError((error: unknown) => {
      const apiError = mapApiError(error);
      snackbar.showError(formatApiErrorForDisplay(apiError));

      return throwError(() => apiError);
    }),
  );
};
