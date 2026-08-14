import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('attaches the Bearer token when one is stored', () => {
    localStorage.setItem('gigdrive.token', 'jwt-token');

    http.get('/api/auth/me').subscribe();

    const req = httpTesting.expectOne('/api/auth/me');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush(null);
  });

  it('passes the request through untouched without a token', () => {
    http.get('/api/concerts').subscribe();

    const req = httpTesting.expectOne('/api/concerts');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
