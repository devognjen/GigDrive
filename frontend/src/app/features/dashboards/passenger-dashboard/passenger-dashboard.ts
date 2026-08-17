import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { Booking } from '../../../core/models/booking.model';
import { BookingList } from '../../bookings/booking-list/booking-list';
import { BookingsActions } from '../../bookings/store/bookings.actions';
import {
  selectDashboardError,
  selectPassengerBookings,
  selectPassengerLoading,
  selectPendingBookingId,
} from '../store/dashboards.selectors';

/**
 * Passenger home: own bookings with status, live price, paid flag, and cancel.
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

  protected readonly bookings = this.store.selectSignal(selectPassengerBookings);
  protected readonly loading = this.store.selectSignal(selectPassengerLoading);
  protected readonly error = this.store.selectSignal(selectDashboardError);
  protected readonly pendingId = this.store.selectSignal(selectPendingBookingId);

  constructor() {
    this.store.dispatch(BookingsActions.loadMine());
  }

  protected cancel(booking: Booking): void {
    this.store.dispatch(BookingsActions.cancel({ id: booking.id }));
  }
}
