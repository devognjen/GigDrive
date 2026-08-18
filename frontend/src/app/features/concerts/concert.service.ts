import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Concert,
  ConcertDetails,
  ConcertFilterOptions,
  ConcertSearchParams,
  ConcertWeather,
  CreateConcertRequest,
} from '../../core/models/concert.model';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ConcertService {
  private readonly http = inject(HttpClient);

  /** Searches concerts; empty params are skipped. Public endpoint. */
  search(params: ConcertSearchParams = {}): Observable<Concert[]> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<Concert[]>(`${API_BASE}/concerts/search`, { params: httpParams });
  }

  /** Distinct cities and genres in the concert cache. Public endpoint. */
  getFilterOptions(): Observable<ConcertFilterOptions> {
    return this.http.get<ConcertFilterOptions>(`${API_BASE}/concerts/filter-options`);
  }

  /** Loads a concert together with the trips linked to it. Public endpoint. */
  getDetails(id: string): Observable<ConcertDetails> {
    return this.http.get<ConcertDetails>(`${API_BASE}/concerts/${id}`);
  }

  /** Concert-day forecast via the backend Open-Meteo proxy. Public endpoint. */
  getWeather(id: string): Observable<ConcertWeather> {
    return this.http.get<ConcertWeather>(`${API_BASE}/concerts/${id}/weather`);
  }

  /** Creates a user-submitted concert. Requires authentication. */
  create(request: CreateConcertRequest): Observable<Concert> {
    return this.http.post<Concert>(`${API_BASE}/concerts`, request);
  }
}
