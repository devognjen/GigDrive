import { Dictionary } from '@ngrx/entity';
import { createSelector } from '@ngrx/store';

import { Booking } from '../../../core/models/booking.model';
import { Trip } from '../../../core/models/trip.model';
import { bookingsFeature } from '../../bookings/store/bookings.reducer';
import { tripsFeature } from '../../trips/store/trips.reducer';
import { aggregateEarnings } from '../earnings';

const selectBookingsWithTrips = createSelector(
  bookingsFeature.selectAllBookings,
  tripsFeature.selectTripEntities,
  (bookings: Booking[], trips: Dictionary<Trip>): Booking[] =>
    bookings.map((booking) => ({
      ...booking,
      trip: trips[booking.tripId] ?? booking.trip,
    })),
);

export const selectDashboardError = createSelector(
  tripsFeature.selectError,
  bookingsFeature.selectError,
  (tripsError: string | null, bookingsError: string | null) => bookingsError ?? tripsError,
);

export const selectDriverLoading = createSelector(
  tripsFeature.selectLoading,
  tripsFeature.selectLoaded,
  bookingsFeature.selectLoading,
  bookingsFeature.selectLoaded,
  (
    tripsLoading: boolean,
    tripsLoaded: boolean,
    bookingsLoading: boolean,
    bookingsLoaded: boolean,
  ) => tripsLoading || bookingsLoading || !tripsLoaded || !bookingsLoaded,
);

export const selectPassengerLoading = createSelector(
  bookingsFeature.selectLoading,
  bookingsFeature.selectLoaded,
  (loading: boolean, loaded: boolean) => loading || !loaded,
);

export const selectDriverTrips = tripsFeature.selectAllTrips;

export const selectPendingRequests = createSelector(
  selectBookingsWithTrips,
  (bookings: Booking[]) => bookings.filter((booking) => booking.status === 'PENDING'),
);

export const selectDriverBookings = selectBookingsWithTrips;

export const selectPassengerBookings = selectBookingsWithTrips;

export const selectPendingBookingId = bookingsFeature.selectPendingId;

export const selectEarnings = createSelector(
  bookingsFeature.selectAllBookings,
  tripsFeature.selectTripEntities,
  aggregateEarnings,
);
