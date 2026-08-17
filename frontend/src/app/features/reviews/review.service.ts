import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateReviewRequest, Review } from '../../core/models/review.model';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);

  /** Confirmed passenger reviews the driver of a past trip. */
  create(tripId: string, request: CreateReviewRequest): Observable<Review> {
    return this.http.post<Review>(`${API_BASE}/trips/${tripId}/reviews`, request);
  }

  /** Lists reviews written about this user as a driver. */
  listForDriver(userId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${API_BASE}/users/${userId}/reviews`);
  }
}
