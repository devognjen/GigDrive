import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { Booking } from '../../../core/models/booking.model';
import { Trip } from '../../../core/models/trip.model';
import {
  fallbackManifestFilename,
  filenameFromContentDisposition,
  triggerBrowserDownload,
} from '../../../core/utils/download';
import { formatMoney } from '../../../core/utils/money';
import { BookingList } from '../../bookings/booking-list/booking-list';
import { BookingsActions } from '../../bookings/store/bookings.actions';
import { TripCard } from '../../trips/trip-card/trip-card';
import { TripService } from '../../trips/trip.service';
import { TripsActions } from '../../trips/store/trips.actions';
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
  private readonly tripService = inject(TripService);

  protected readonly trips = this.store.selectSignal(selectDriverTrips);
  protected readonly bookings = this.store.selectSignal(selectDriverBookings);
  protected readonly earnings = this.store.selectSignal(selectEarnings);
  protected readonly loading = this.store.selectSignal(selectDriverLoading);
  protected readonly error = this.store.selectSignal(selectDashboardError);
  protected readonly pendingId = this.store.selectSignal(selectPendingBookingId);
  protected readonly exportError = signal<string | null>(null);

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

  protected exportCsv(trip: Trip): void {
    this.exportError.set(null);
    this.tripService.exportManifest(trip.id).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) {
          return;
        }
        triggerBrowserDownload(
          blob,
          filenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
            fallbackManifestFilename(trip),
        );
      },
      error: () => {
        this.exportError.set('Could not export the passenger manifest.');
      },
    });
  }
}
