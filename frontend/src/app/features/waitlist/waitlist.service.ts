import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateWaitlistRequest, WaitlistEntry } from '../../core/models/waitlist.model';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class WaitlistService {
  private readonly http = inject(HttpClient);

  /** Passenger joins the waitlist of a FULL trip. */
  join(tripId: string, request: CreateWaitlistRequest): Observable<WaitlistEntry> {
    return this.http.post<WaitlistEntry>(`${API_BASE}/trips/${tripId}/waitlist`, request);
  }

  /** Passenger leaves the waitlist of a trip. */
  leave(tripId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/trips/${tripId}/waitlist`);
  }

  /** Lists the authenticated passenger's own waitlist entries. */
  listMine(): Observable<WaitlistEntry[]> {
    return this.http.get<WaitlistEntry[]>(`${API_BASE}/waitlist/mine`);
  }
}
