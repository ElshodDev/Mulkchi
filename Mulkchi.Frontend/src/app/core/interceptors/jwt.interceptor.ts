import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'access_token';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip auth endpoints - they don't need JWT token
  const skipAuthUrls = ['/api/auth/login', '/api/auth/register', '/api/auth/google', '/api/auth/refresh'];
  const isAuthUrl = skipAuthUrls.some(url => req.url.includes(url));
  
  if (isAuthUrl) {
    return next(req);
  }

  // Get token from localStorage using the correct key
  const rawToken = localStorage.getItem(TOKEN_KEY);

  // Handle "undefined" string or null/undefined
  const token = rawToken && rawToken !== 'undefined' ? rawToken : null;

  // Only add token to API requests if it's valid
  if (req.url.startsWith(environment.apiUrl) && token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
