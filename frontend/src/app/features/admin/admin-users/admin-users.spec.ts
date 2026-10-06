import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { buildUser } from '../../../testing/user.fixture';
import { AdminUsers } from './admin-users';

describe('AdminUsers', () => {
  let fixture: ComponentFixture<AdminUsers>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminUsers],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
    const auth = TestBed.inject(AuthService);
    auth.login('admin@gigdrive.demo', 'demo').subscribe();
    httpTesting
      .expectOne('/api/auth/login')
      .flush({ accessToken: 'jwt', user: buildUser({ id: 'admin-id', isAdmin: true }) });
    fixture = TestBed.createComponent(AdminUsers);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('lists users and shows an empty state', async () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/admin/users?page=0').flush({ items: [], total: 0, page: 0 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No users match that search.');
  });

  it('disables a user', async () => {
    const passenger = {
      id: 'p1',
      email: 'ana@gigdrive.demo',
      firstName: 'Ana',
      lastName: 'Passenger',
      phone: null,
      isAdmin: false,
      disabledAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    fixture.detectChanges();
    httpTesting.expectOne('/api/admin/users?page=0').flush({ items: [passenger], total: 1, page: 0 });
    await fixture.whenStable();
    fixture.detectChanges();

    const button = [...fixture.nativeElement.querySelectorAll('button')].find((el) =>
      el.textContent?.includes('Disable'),
    ) as HTMLButtonElement;
    button.click();
    const req = httpTesting.expectOne('/api/admin/users/p1/disable');
    expect(req.request.method).toBe('POST');
    req.flush({ ...passenger, disabledAt: '2026-09-25T00:00:00.000Z' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Enable');
  });
});
