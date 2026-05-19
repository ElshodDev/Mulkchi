import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

interface CacheEntry {
  expiresAt: number;
  response: HttpResponse<unknown>;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function canCacheRequest(url: string): boolean {
  return (
    url.startsWith(`${environment.apiUrl}/properties`) ||
    url.includes('/amenities') ||
    url.includes('/categories')
  );
}

function clearApiCache(): void {
  cache.clear();
}

export const cacheInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  if (req.method !== 'GET') {
    clearApiCache();
    return next(req);
  }

  if (!canCacheRequest(req.url)) {
    return next(req);
  }

  const cacheKey = `${req.method}:${req.urlWithParams}`;
  const cachedResponse = cache.get(cacheKey);

  if (cachedResponse && cachedResponse.expiresAt > Date.now()) {
    return of(cachedResponse.response.clone());
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(cacheKey, {
          expiresAt: Date.now() + CACHE_TTL_MS,
          response: event.clone(),
        });
      }
    }),
  );
};
