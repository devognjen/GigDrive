import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';
import { User } from './core/models/user.model';
import { AuthService } from './core/services/auth.service';

const mockUser: User = {
  id: 'u1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: null,
  emailNotifications: true,
};

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.clear();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the guest navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.brand')?.textContent).toContain('GigDrive');
    const links = [...compiled.querySelectorAll('nav a')].map((a) => a.textContent?.trim());
    expect(links).toEqual(['Concerts', 'Trips', 'Log in', 'Register']);
  });

  it('renders the authenticated navigation and logs out', async () => {
    const authService = TestBed.inject(AuthService);
    authService.login('ada@example.com', 'password123').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/login')
      .flush({ accessToken: 'jwt-token', user: mockUser });

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const links = [...compiled.querySelectorAll('nav a')].map((a) => a.textContent?.trim());
    expect(links).toEqual(['Concerts', 'Trips', 'Driver', 'Passenger', 'Profile']);
    expect(compiled.querySelector('.user-name')?.textContent).toContain('Ada');

    const logoutButton = compiled.querySelector('button.logout') as HTMLButtonElement;
    expect(logoutButton.textContent).toContain('Log out');
    logoutButton.click();

    expect(authService.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('gigdrive.token')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/concerts']);
  });
});
