import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isLoggedIn()) {
    return true;
  }

  const returnUrl = route.url.map(segment => segment.path).join('/');
  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl } });
};
