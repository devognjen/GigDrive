import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Lets authenticated users through. When the session has not been restored
 * yet (e.g. hard refresh with a stored token), waits for the restore before
 * deciding. Guests are redirected to the login page.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return authService
    .ensureSessionLoaded()
    .pipe(map((user) => (user ? true : router.createUrlTree(['/auth/login']))));
};
