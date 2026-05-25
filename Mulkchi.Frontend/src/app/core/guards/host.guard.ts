import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { UserRole } from '../models';
import { AuthStore } from '../stores/auth.store';

export const hostGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isLoggedIn()) {
    const returnUrl = route.url.map((segment) => segment.path).join('/');
    return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl } });
  }

  const user = authStore.currentUser();
  const role = user?.role;
  const currentMode = authStore.currentMode();

  if (
    currentMode === UserRole.Host ||
    role === UserRole.Host ||
    role === UserRole.Admin ||
    role === UserRole.SuperAdmin
  ) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
};
