import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthResponse, User } from '../models/user.model';
import { AuthService } from './auth.service';

const TOKEN_KEY = 'gigdrive.token';

const mockUser: User = {
  id: 'u1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: null,
  emailNotifications: true,
};

const mockAuthResponse: AuthResponse = {
  accessToken: 'jwt-token',
  user: mockUser,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  describe('without a stored token', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
    });

    it('starts unauthenticated', () => {
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getToken()).toBeNull();
    });

    it('logs in, stores the token and sets the current user', () => {
      let result: User | undefined;
      service.login('ada@example.com', 'password123').subscribe((user) => (result = user));

      const req = httpTesting.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'ada@example.com', password: 'password123' });
      req.flush(mockAuthResponse);

      expect(result).toEqual(mockUser);
      expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-token');
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('registers, stores the token and sets the current user', () => {
      const payload = {
        email: 'ada@example.com',
        password: 'password123',
        firstName: 'Ada',
        lastName: 'Lovelace',
      };
      service.register(payload).subscribe();

      const req = httpTesting.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockAuthResponse);

      expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-token');
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('updates the profile and sets the current user', () => {
      service.login('ada@example.com', 'password123').subscribe();
      httpTesting.expectOne('/api/auth/login').flush(mockAuthResponse);

      const updated: User = { ...mockUser, firstName: 'Augusta' };
      service.updateProfile({ firstName: 'Augusta' }).subscribe();

      const req = httpTesting.expectOne('/api/users/me');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ firstName: 'Augusta' });
      req.flush(updated);

      expect(service.currentUser()).toEqual(updated);
    });
  });

  describe('with an authenticated session', () => {
    beforeEach(() => {
      service = TestBed.inject(AuthService);
      service.login('ada@example.com', 'password123').subscribe();
      httpTesting.expectOne('/api/auth/login').flush(mockAuthResponse);
    });

    it('logs out: clears the token and the current user', () => {
      service.logout();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('fetchMe refreshes the current user', () => {
      const refreshed: User = { ...mockUser, phone: '123' };
      service.fetchMe().subscribe();

      const req = httpTesting.expectOne('/api/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush(refreshed);

      expect(service.currentUser()).toEqual(refreshed);
    });
  });

  describe('with a stale stored token', () => {
    beforeEach(() => {
      localStorage.setItem(TOKEN_KEY, 'stale-token');
      service = TestBed.inject(AuthService);
    });

    it('restores the session on creation', () => {
      const req = httpTesting.expectOne('/api/auth/me');
      req.flush(mockUser);

      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('clears the stale token when /auth/me answers 401', () => {
      const req = httpTesting.expectOne('/api/auth/me');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(service.currentUser()).toBeNull();
      expect(service.getToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('ensureSessionLoaded', () => {
    it('resolves to null when there is no token', () => {
      service = TestBed.inject(AuthService);

      let result: User | null | undefined;
      service.ensureSessionLoaded().subscribe((user) => (result = user));

      expect(result).toBeNull();
      httpTesting.expectNone('/api/auth/me');
    });

    it('de-duplicates concurrent session restores', () => {
      localStorage.setItem(TOKEN_KEY, 'jwt-token');
      service = TestBed.inject(AuthService);

      // The constructor already started a restore; a second call must share it.
      service.ensureSessionLoaded().subscribe();

      const requests = httpTesting.match('/api/auth/me');
      expect(requests.length).toBe(1);
      requests[0].flush(mockUser);

      expect(service.currentUser()).toEqual(mockUser);
    });
  });
});
