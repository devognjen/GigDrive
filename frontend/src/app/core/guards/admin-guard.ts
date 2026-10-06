import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Lets admins through. Guests go to login; authenticated non-admins go home.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const decide = (isAdmin: boolean, authenticated: boolean) => {
    if (isAdmin) {
      return true;
    }
    return router.createUrlTree([authenticated ? '/concerts' : '/auth/login']);
  };

  const user = authService.currentUser();
  if (user) {
    return decide(user.isAdmin, true);
  }

  return authService
    .ensureSessionLoaded()
    .pipe(map((loaded) => decide(loaded?.isAdmin === true, loaded !== null)));
};
