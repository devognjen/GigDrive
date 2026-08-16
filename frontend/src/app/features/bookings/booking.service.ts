import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Booking, CreateBookingRequest } from '../../core/models/booking.model';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  /** Passenger requests seats on a trip. */
  request(tripId: string, request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${API_BASE}/trips/${tripId}/bookings`, request);
  }

  /** Lists the authenticated passenger's own bookings. */
  listMine(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API_BASE}/bookings/mine`);
  }

  /** Lists bookings across all trips the authenticated user drives. */
  listForDriver(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API_BASE}/bookings`);
  }

  /** Driver accepts a booking. */
  accept(id: string): Observable<Booking> {
    return this.http.post<Booking>(`${API_BASE}/bookings/${id}/accept`, {});
  }

  /** Driver rejects a booking. */
  reject(id: string): Observable<Booking> {
    return this.http.post<Booking>(`${API_BASE}/bookings/${id}/reject`, {});
  }

  /** Passenger cancels their own booking. */
  cancel(id: string): Observable<Booking> {
    return this.http.post<Booking>(`${API_BASE}/bookings/${id}/cancel`, {});
  }

  /** Driver toggles the paid flag on a booking. */
  setPaid(id: string, paid: boolean): Observable<Booking> {
    return this.http.patch<Booking>(`${API_BASE}/bookings/${id}/paid`, { paid });
  }
}
