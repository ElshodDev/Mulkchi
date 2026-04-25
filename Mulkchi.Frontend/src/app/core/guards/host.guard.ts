import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

export const hostGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // First check if user is authenticated at all
  if (!authService.isAuthenticated()) {
    // Store attempted URL for redirect after login
    const returnUrl = route.url.map(segment => segment.path).join('/');
    router.navigate(['/auth/login'], { queryParams: { returnUrl } });
    return false;
  }
  
  const user = authService.currentUser();
  const role = user?.role;
  const currentMode = authService.currentMode();
  
  // Allow if user is in Host mode or has Host/Admin/SuperAdmin role
  if (currentMode === UserRole.Host || 
      role === UserRole.Host || 
      role === UserRole.Admin || 
      role === UserRole.SuperAdmin) {
    return true;
  }
  
  // User is authenticated but not in Host mode
  // Show a dialog or redirect to mode switch page
  // For now, allow them to access but they'll see a mode switch prompt
  // Alternatively, redirect to home with a message
  router.navigate(['/'], { queryParams: { modeSwitchRequired: 'true', returnUrl: route.url.map(segment => segment.path).join('/') } });
  return false;
};
