import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    return true;
  }
  
  // Store attempted URL for redirect after login
  const returnUrl = route.url.map(segment => segment.path).join('/');
  router.navigate(['/auth/login'], { queryParams: { returnUrl } });
  return false;
};
