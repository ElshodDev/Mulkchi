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
  '/auth/refresh-token',
  '/auth/logout',
];

const XSRF_COOKIE_NAME = 'XSRF-TOKEN';
const XSRF_HEADER_NAME = 'X-XSRF-TOKEN';

function readCookie(cookieName: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.substring(cookieName.length + 1));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getAccessToken();
  const shouldSkipToken = AUTH_FREE_PATHS.some((path) => req.url.includes(path));
  const xsrfToken = readCookie(XSRF_COOKIE_NAME);
  const shouldAttachXsrf =
    req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';
  const headers: Record<string, string> = {};

  if (token && !shouldSkipToken) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (xsrfToken && shouldAttachXsrf) {
    headers[XSRF_HEADER_NAME] = xsrfToken;
  }

  const nextRequest = req.clone({
    withCredentials: true,
    ...(Object.keys(headers).length > 0 ? { setHeaders: headers } : {}),
  });

  return next(nextRequest);
};
