import { CanActivateFn } from '@angular/router';

/**
 * Stub guard: everything passes until the auth feature (02-auth-and-users)
 * wires up the session store. Kept as a separate file so lazy routes already
 * reference their final guard.
 */
export const authGuard: CanActivateFn = () => {
  // TODO(feature 02): redirect to /auth/login when no valid JWT is present.
  return true;
};
