import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, retry, switchMap, throwError, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

const SKIP_404_NAVIGATION_PATHS = [
  '/properties/',
  '/users/',
  '/notifications/',
  '/favorites',
  '/bookings',
  '/reviews',
  '/messages',
];

function shouldRetryRequest(req: HttpRequest<unknown>, error: HttpErrorResponse): boolean {
  return (
    (req.method === 'GET' || req.method === 'HEAD') && (error.status === 0 || error.status >= 500)
  );
}

function isDataEndpoint404(url: string): boolean {
  return SKIP_404_NAVIGATION_PATHS.some((path) => url.includes(path));
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    retry({
      count: 3,
      delay: (error: HttpErrorResponse, retryCount) =>
        shouldRetryRequest(req, error)
          ? timer(Math.min(400 * 2 ** retryCount, 2400))
          : throwError(() => error),
    }),
    catchError((error: HttpErrorResponse) => {
      const isApiRequest = req.url.startsWith(environment.apiUrl);
      const isRefreshRequest = req.url.includes('/auth/refresh-token');
      const isAuthRequest =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/google');

      if (error.status === 401 && isApiRequest && !isRefreshRequest && !isAuthRequest) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            const refreshedToken = authService.getAccessToken();

            return next(
              req.clone({
                withCredentials: true,
                ...(refreshedToken
                  ? {
                      setHeaders: {
                        Authorization: `Bearer ${refreshedToken}`,
                      },
                    }
                  : {}),
              }),
            );
          }),
          catchError((refreshError) => {
            authService.clearAuth(false);
            void router.navigate(['/auth/login'], {
              queryParams: { returnUrl: router.url },
            });
            return throwError(() => refreshError);
          }),
        );
      }

      if (error.status === 400) {
        const validationErrors = error.error?.errors as Record<string, string[]> | undefined;
        const validationMessage =
          (validationErrors && Object.values(validationErrors).flat().join(' ')) ||
          error.error?.error?.message ||
          error.error?.message ||
          "So'rovni qayta tekshirib ko'ring.";

        if (!isRefreshRequest) {
          toastService.warning(validationMessage);
        }
      } else if (error.status === 401) {
        authService.clearAuth(false);
        void router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url },
        });
      } else if (error.status === 403) {
        void router.navigate(['/forbidden']);
      } else if (error.status === 404 && isApiRequest && !isDataEndpoint404(req.url)) {
        void router.navigate(['/not-found']);
      } else if (error.status >= 500) {
        toastService.error("Kutilmagan xatolik yuz berdi. Bir ozdan keyin qayta urinib ko'ring.");
        void router.navigate(['/server-error']);
      } else if (error.status === 0) {
        toastService.error("Internet ulanishi topilmadi. Tarmoqni tekshirib ko'ring.");
      }

      return throwError(() => error);
    }),
  );
};
