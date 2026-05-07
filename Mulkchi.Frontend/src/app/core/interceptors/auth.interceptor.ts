import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

const AUTH_FREE_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/reset-password',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const shouldSkipToken = AUTH_FREE_PATHS.some((path) => req.url.includes(path));

  const nextRequest = req.clone({
    withCredentials: true,
    ...(token && !shouldSkipToken
      ? {
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }
      : {}),
  });

  return next(nextRequest);
};
