import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';

import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth-guard';

const mockUser: User = {
  id: 'u1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: null,
  emailNotifications: true,
};

describe('authGuard', () => {
  let httpTesting: HttpTestingController;
  let router: Router;

  const executeGuard = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree> | boolean;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('redirects guests to /auth/login', async () => {
    const result = await firstValueFrom(executeGuard() as Observable<boolean | UrlTree>);

    expect(result).toEqual(router.createUrlTree(['/auth/login']));
  });

  it('allows authenticated users', async () => {
    const authService = TestBed.inject(AuthService);
    authService.login('ada@example.com', 'password123').subscribe();
    httpTesting.expectOne('/api/auth/login').flush({ accessToken: 'jwt-token', user: mockUser });

    expect(executeGuard()).toBe(true);
  });

  it('restores the session from a stored token before deciding', async () => {
    localStorage.setItem('gigdrive.token', 'jwt-token');
    // Constructing the service (via the guard) kicks off the session restore.
    const result$ = firstValueFrom(executeGuard() as Observable<boolean | UrlTree>);

    httpTesting.expectOne('/api/auth/me').flush(mockUser);

    expect(await result$).toBe(true);
  });

  it('redirects when the stored token is rejected', async () => {
    localStorage.setItem('gigdrive.token', 'stale-token');
    const result$ = firstValueFrom(executeGuard() as Observable<boolean | UrlTree>);

    httpTesting
      .expectOne('/api/auth/me')
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(await result$).toEqual(router.createUrlTree(['/auth/login']));
  });
});
