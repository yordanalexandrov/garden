import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthSessionService } from '../auth/auth-session.service';
import { API_BASE_URL } from '../config/api-base-url';
import { isApiRequestUrl } from '../api/api-url';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBaseUrl = inject(API_BASE_URL);

  if (!isApiRequestUrl(request.url, apiBaseUrl)) {
    return next(request);
  }

  const accessToken = inject(AuthSessionService).getAccessToken();

  if (accessToken === null) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  );
};
