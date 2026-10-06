import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminStats, AdminUser, AdminUserList } from '../../core/models/admin.model';
import { Concert } from '../../core/models/concert.model';
import { Trip, TripStatus } from '../../core/models/trip.model';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${API_BASE}/admin/stats`);
  }

  listUsers(q = '', page = 0): Observable<AdminUserList> {
    let params = new HttpParams().set('page', String(page));
    if (q.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<AdminUserList>(`${API_BASE}/admin/users`, { params });
  }

  disableUser(id: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${API_BASE}/admin/users/${id}/disable`, {});
  }

  enableUser(id: string): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${API_BASE}/admin/users/${id}/enable`, {});
  }

  listConcerts(filters: { userSubmitted?: boolean; hidden?: boolean } = {}): Observable<Concert[]> {
    let params = new HttpParams();
    if (filters.userSubmitted !== undefined) {
      params = params.set('userSubmitted', String(filters.userSubmitted));
    }
    if (filters.hidden !== undefined) {
      params = params.set('hidden', String(filters.hidden));
    }
    return this.http.get<Concert[]>(`${API_BASE}/admin/concerts`, { params });
  }

  hideConcert(id: string): Observable<Concert> {
    return this.http.post<Concert>(`${API_BASE}/admin/concerts/${id}/hide`, {});
  }

  unhideConcert(id: string): Observable<Concert> {
    return this.http.post<Concert>(`${API_BASE}/admin/concerts/${id}/unhide`, {});
  }

  listTrips(status?: TripStatus): Observable<Trip[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Trip[]>(`${API_BASE}/admin/trips`, { params });
  }

  cancelTrip(id: string): Observable<Trip> {
    return this.http.post<Trip>(`${API_BASE}/admin/trips/${id}/cancel`, {});
  }
}
