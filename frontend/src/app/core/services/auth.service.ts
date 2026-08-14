import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap, throwError } from 'rxjs';

import {
  AuthResponse,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from '../models/user.model';

const TOKEN_STORAGE_KEY = 'gigdrive.token';
const API_BASE = '/api';

/**
 * Signal-based session store for the auth feature. Deliberately not an NgRx
 * slice yet — state moves into the store in a later milestone.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly currentUserState = signal<User | null>(null);
  private sessionLoad$: Observable<User | null> | null = null;

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    // Session restore: a stored token means the user was logged in before
    // (e.g. hard refresh), so load the profile right away.
    if (this.getToken()) {
      this.ensureSessionLoaded().subscribe();
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/login`, { email, password })
      .pipe(map((response) => this.setSession(response)));
  }

  register(payload: RegisterRequest): Observable<User> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/register`, payload)
      .pipe(map((response) => this.setSession(response)));
  }

  logout(): void {
    this.clearSession();
  }

  /** Loads the current user from the API; a 401 drops the stale token. */
  fetchMe(): Observable<User> {
    return this.http.get<User>(`${API_BASE}/auth/me`).pipe(
      tap((user) => this.currentUserState.set(user)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.clearSession();
        }
        return throwError(() => error);
      }),
    );
  }

  updateProfile(dto: UpdateProfileRequest): Observable<User> {
    return this.http
      .patch<User>(`${API_BASE}/users/me`, dto)
      .pipe(tap((user) => this.currentUserState.set(user)));
  }

  /**
   * Ensures the session has been restored from a stored token. Concurrent
   * calls share a single in-flight request; resolves to null when there is
   * no token or the token is invalid.
   */
  ensureSessionLoaded(): Observable<User | null> {
    const user = this.currentUser();
    if (user || !this.getToken()) {
      return of(user);
    }
    this.sessionLoad$ ??= this.fetchMe().pipe(
      map((loaded) => loaded as User | null),
      catchError(() => of(null)),
      finalize(() => (this.sessionLoad$ = null)),
      shareReplay(1),
    );
    return this.sessionLoad$;
  }

  private setSession(response: AuthResponse): User {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    this.currentUserState.set(response.user);
    return response.user;
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.currentUserState.set(null);
  }
}
