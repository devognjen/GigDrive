import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Vehicle, VehicleRequest } from '../../core/models/vehicle.model';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);

  /** Lists the vehicles of the authenticated user. */
  list(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${API_BASE}/vehicles`);
  }

  /** Creates a vehicle for the authenticated user. */
  create(request: VehicleRequest): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${API_BASE}/vehicles`, request);
  }

  /** Updates a vehicle of the authenticated user. */
  update(id: string, request: VehicleRequest): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${API_BASE}/vehicles/${id}`, request);
  }

  /** Deletes a vehicle of the authenticated user. */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/vehicles/${id}`);
  }
}
