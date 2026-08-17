import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { Booking } from '../../../core/models/booking.model';
import { BookingList } from '../../bookings/booking-list/booking-list';
import { BookingsActions } from '../../bookings/store/bookings.actions';
import { TripCard } from '../../trips/trip-card/trip-card';
import { TripsActions } from '../../trips/store/trips.actions';
import { formatMoney } from '../../../core/utils/money';
import {
  selectDashboardError,
  selectDriverBookings,
  selectDriverLoading,
  selectDriverTrips,
  selectEarnings,
  selectPendingBookingId,
} from '../store/dashboards.selectors';

/**
 * Driver home: own trips, incoming requests, earnings, accept/reject/paid.
 */
@Component({
  selector: 'app-driver-dashboard',
  imports: [RouterLink, TripCard, BookingList],
  templateUrl: './driver-dashboard.html',
  styleUrl: './driver-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverDashboard {
  private readonly store = inject(Store);

  protected readonly trips = this.store.selectSignal(selectDriverTrips);
  protected readonly bookings = this.store.selectSignal(selectDriverBookings);
  protected readonly earnings = this.store.selectSignal(selectEarnings);
  protected readonly loading = this.store.selectSignal(selectDriverLoading);
  protected readonly error = this.store.selectSignal(selectDashboardError);
  protected readonly pendingId = this.store.selectSignal(selectPendingBookingId);

  constructor() {
    this.store.dispatch(TripsActions.loadMine());
    this.store.dispatch(BookingsActions.loadForDriver());
  }

  protected accept(booking: Booking): void {
    this.store.dispatch(BookingsActions.accept({ id: booking.id }));
  }

  protected reject(booking: Booking): void {
    this.store.dispatch(BookingsActions.reject({ id: booking.id }));
  }

  protected togglePaid(booking: Booking): void {
    this.store.dispatch(BookingsActions.setPaid({ id: booking.id, paid: !booking.paid }));
  }

  protected formatTotal(minorUnits: number, currency: 'EUR' | 'RSD'): string {
    return formatMoney(minorUnits, currency);
  }
}
