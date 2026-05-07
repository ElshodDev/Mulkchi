import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserRole } from '../models';
import { AuthStore } from '../stores/auth.store';

export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const currentUser = authStore.currentUser();

  if (currentUser && (currentUser.role === UserRole.Admin || currentUser.role === UserRole.SuperAdmin)) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
};
