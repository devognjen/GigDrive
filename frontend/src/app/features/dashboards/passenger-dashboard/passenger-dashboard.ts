import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { Booking } from '../../../core/models/booking.model';
import { WaitlistEntry } from '../../../core/models/waitlist.model';
import { BookingList, ReviewSubmission } from '../../bookings/booking-list/booking-list';
import { BookingsActions } from '../../bookings/store/bookings.actions';
import { ReviewService } from '../../reviews/review.service';
import { WaitlistList } from '../../waitlist/waitlist-list/waitlist-list';
import { WaitlistService } from '../../waitlist/waitlist.service';
import {
  selectDashboardError,
  selectPassengerBookings,
  selectPassengerLoading,
  selectPendingBookingId,
} from '../store/dashboards.selectors';

/**
 * Passenger home: own bookings with status, live price, paid flag, cancel,
 * a review form on eligible past trips, and waitlist entries with position.
 */
@Component({
  selector: 'app-passenger-dashboard',
  imports: [RouterLink, BookingList, WaitlistList],
  templateUrl: './passenger-dashboard.html',
  styleUrl: './passenger-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassengerDashboard {
  private readonly store = inject(Store);
  private readonly reviewService = inject(ReviewService);
  private readonly waitlistService = inject(WaitlistService);

  protected readonly bookings = this.store.selectSignal(selectPassengerBookings);
  protected readonly loading = this.store.selectSignal(selectPassengerLoading);
  protected readonly error = this.store.selectSignal(selectDashboardError);
  protected readonly pendingId = this.store.selectSignal(selectPendingBookingId);
  protected readonly reviewPendingTripId = signal<string | null>(null);
  protected readonly reviewError = signal<string | null>(null);
  protected readonly waitlistEntries = signal<WaitlistEntry[]>([]);
  protected readonly waitlistLoading = signal(true);
  protected readonly waitlistError = signal<string | null>(null);
  protected readonly waitlistPendingTripId = signal<string | null>(null);

  constructor() {
    this.store.dispatch(BookingsActions.loadMine());
    this.loadWaitlist();
  }

  protected cancel(booking: Booking): void {
    this.store.dispatch(BookingsActions.cancel({ id: booking.id }));
  }

  protected leaveWaitlist(entry: WaitlistEntry): void {
    this.waitlistError.set(null);
    this.waitlistPendingTripId.set(entry.tripId);
    this.waitlistService.leave(entry.tripId).subscribe({
      next: () => {
        this.waitlistPendingTripId.set(null);
        this.waitlistEntries.update((entries) =>
          entries.filter((item) => item.id !== entry.id),
        );
      },
      error: () => {
        this.waitlistPendingTripId.set(null);
        this.waitlistError.set('Could not leave the waitlist.');
      },
    });
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

  private loadWaitlist(): void {
    this.waitlistLoading.set(true);
    this.waitlistService.listMine().subscribe({
      next: (entries) => {
        this.waitlistEntries.set(entries);
        this.waitlistLoading.set(false);
      },
      error: () => {
        this.waitlistLoading.set(false);
        this.waitlistError.set('Could not load your waitlist.');
      },
    });
  }
}
