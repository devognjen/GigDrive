import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateTripRequest, Trip, TripSearchParams } from '../../core/models/trip.model';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly http = inject(HttpClient);

  /** Lists trips, optionally filtered and sorted. */
  list(params: TripSearchParams = {}): Observable<Trip[]> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<Trip[]>(`${API_BASE}/trips`, { params: httpParams });
  }

  /** Lists the trips of the authenticated driver. */
  listMine(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${API_BASE}/trips/mine`);
  }

  /** Loads a single trip with its live price. */
  get(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${API_BASE}/trips/${id}`);
  }

  /** Creates a trip for the authenticated driver. */
  create(request: CreateTripRequest): Observable<Trip> {
    return this.http.post<Trip>(`${API_BASE}/trips`, request);
  }

  /** Applies a partial update to an OPEN trip the driver owns. */
  update(id: string, request: Partial<CreateTripRequest>): Observable<Trip> {
    return this.http.patch<Trip>(`${API_BASE}/trips/${id}`, request);
  }

  /** Driver confirms a READY trip. */
  confirm(id: string): Observable<Trip> {
    return this.http.post<Trip>(`${API_BASE}/trips/${id}/confirm`, {});
  }

  /** Driver cancels a trip. */
  cancel(id: string): Observable<Trip> {
    return this.http.post<Trip>(`${API_BASE}/trips/${id}/cancel`, {});
  }

  /** Downloads the confirmed-passenger CSV for a trip the user drives. */
  exportManifest(id: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${API_BASE}/trips/${id}/manifest`, {
      responseType: 'blob',
      observe: 'response',
    });
  }
}
