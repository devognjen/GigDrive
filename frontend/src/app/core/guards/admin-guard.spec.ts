import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { buildUser } from '../../testing/user.fixture';
import { adminGuard } from './admin-guard';

describe('adminGuard', () => {
  let httpTesting: HttpTestingController;
  let router: Router;

  const executeGuard = () =>
    TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
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

  it('allows admins', async () => {
    const authService = TestBed.inject(AuthService);
    authService.login('admin@gigdrive.demo', 'demo1234').subscribe();
    httpTesting
      .expectOne('/api/auth/login')
      .flush({ accessToken: 'jwt', user: buildUser({ isAdmin: true }) });

    expect(executeGuard()).toBe(true);
  });

  it('redirects authenticated non-admins to /concerts', async () => {
    const authService = TestBed.inject(AuthService);
    authService.login('ada@example.com', 'password123').subscribe();
    httpTesting
      .expectOne('/api/auth/login')
      .flush({ accessToken: 'jwt', user: buildUser() });

    expect(executeGuard()).toEqual(router.createUrlTree(['/concerts']));
  });
});
