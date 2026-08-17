import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { Booking } from '../../../core/models/booking.model';
import { BookingList, ReviewSubmission } from '../../bookings/booking-list/booking-list';
import { BookingsActions } from '../../bookings/store/bookings.actions';
import { ReviewService } from '../../reviews/review.service';
import {
  selectDashboardError,
  selectPassengerBookings,
  selectPassengerLoading,
  selectPendingBookingId,
} from '../store/dashboards.selectors';

/**
 * Passenger home: own bookings with status, live price, paid flag, cancel,
 * and a review form on eligible past trips.
 */
@Component({
  selector: 'app-passenger-dashboard',
  imports: [RouterLink, BookingList],
  templateUrl: './passenger-dashboard.html',
  styleUrl: './passenger-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassengerDashboard {
  private readonly store = inject(Store);
  private readonly reviewService = inject(ReviewService);

  protected readonly bookings = this.store.selectSignal(selectPassengerBookings);
  protected readonly loading = this.store.selectSignal(selectPassengerLoading);
  protected readonly error = this.store.selectSignal(selectDashboardError);
  protected readonly pendingId = this.store.selectSignal(selectPendingBookingId);
  protected readonly reviewPendingTripId = signal<string | null>(null);
  protected readonly reviewError = signal<string | null>(null);

  constructor() {
    this.store.dispatch(BookingsActions.loadMine());
  }

  protected cancel(booking: Booking): void {
    this.store.dispatch(BookingsActions.cancel({ id: booking.id }));
  }

  protected submitReview(event: ReviewSubmission): void {
    this.reviewError.set(null);
    this.reviewPendingTripId.set(event.booking.tripId);
    this.reviewService
      .create(event.booking.tripId, { rating: event.rating, comment: event.comment })
      .subscribe({
        next: () => {
          this.reviewPendingTripId.set(null);
          this.store.dispatch(BookingsActions.loadMine());
        },
        error: (error: HttpErrorResponse) => {
          this.reviewPendingTripId.set(null);
          const message = Array.isArray(error.error?.message)
            ? error.error.message.join(' ')
            : error.error?.message;
          this.reviewError.set(message ?? 'Could not submit your review.');
        },
      });
  }
}
