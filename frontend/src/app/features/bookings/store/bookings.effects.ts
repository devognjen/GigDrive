import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, Observable, of, switchMap } from 'rxjs';

import { Booking } from '../../../core/models/booking.model';
import { TripsActions } from '../../trips/store/trips.actions';
import { BookingService } from '../booking.service';
import { mutationError } from './booking-errors';
import { BookingsActions } from './bookings.actions';

function hydrateFromBookings(bookings: Booking[]) {
  return of(
    BookingsActions.loadMineSuccess({ bookings }),
    TripsActions.upsertTrips({ trips: bookings.map((booking) => booking.trip) }),
  );
}

function hydrateFromDriverBookings(bookings: Booking[]) {
  return of(
    BookingsActions.loadForDriverSuccess({ bookings }),
    TripsActions.upsertTrips({ trips: bookings.map((booking) => booking.trip) }),
  );
}

function hydrateMutation(booking: Booking) {
  return of(
    BookingsActions.mutationSuccess({ booking }),
    TripsActions.upsertTrip({ trip: booking.trip }),
  );
}

function runMutation(
  request: Observable<Booking>,
  verb: string,
): Observable<
  | ReturnType<typeof BookingsActions.mutationSuccess>
  | ReturnType<typeof BookingsActions.mutationFailure>
  | ReturnType<typeof TripsActions.upsertTrip>
> {
  return request.pipe(
    switchMap((booking) => hydrateMutation(booking)),
    catchError((error: HttpErrorResponse) =>
      of(BookingsActions.mutationFailure({ error: mutationError(verb, error) })),
    ),
  );
}

export const loadMine = createEffect(
  (actions$ = inject(Actions), bookingService = inject(BookingService)) =>
    actions$.pipe(
      ofType(BookingsActions.loadMine),
      exhaustMap(() =>
        bookingService.listMine().pipe(
          switchMap((bookings) => hydrateFromBookings(bookings)),
          catchError(() =>
            of(BookingsActions.loadMineFailure({ error: 'Could not load your bookings.' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const loadForDriver = createEffect(
  (actions$ = inject(Actions), bookingService = inject(BookingService)) =>
    actions$.pipe(
      ofType(BookingsActions.loadForDriver),
      exhaustMap(() =>
        bookingService.listForDriver().pipe(
          switchMap((bookings) => hydrateFromDriverBookings(bookings)),
          catchError(() =>
            of(
              BookingsActions.loadForDriverFailure({
                error: 'Could not load incoming requests.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const acceptBooking = createEffect(
  (actions$ = inject(Actions), bookingService = inject(BookingService)) =>
    actions$.pipe(
      ofType(BookingsActions.accept),
      exhaustMap(({ id }) => runMutation(bookingService.accept(id), 'accept')),
    ),
  { functional: true },
);

export const rejectBooking = createEffect(
  (actions$ = inject(Actions), bookingService = inject(BookingService)) =>
    actions$.pipe(
      ofType(BookingsActions.reject),
      exhaustMap(({ id }) => runMutation(bookingService.reject(id), 'reject')),
    ),
  { functional: true },
);

export const cancelBooking = createEffect(
  (actions$ = inject(Actions), bookingService = inject(BookingService)) =>
    actions$.pipe(
      ofType(BookingsActions.cancel),
      exhaustMap(({ id }) => runMutation(bookingService.cancel(id), 'cancel')),
    ),
  { functional: true },
);

export const setPaid = createEffect(
  (actions$ = inject(Actions), bookingService = inject(BookingService)) =>
    actions$.pipe(
      ofType(BookingsActions.setPaid),
      exhaustMap(({ id, paid }) => runMutation(bookingService.setPaid(id, paid), 'update payment')),
    ),
  { functional: true },
);

export const bookingsEffects = [
  loadMine,
  loadForDriver,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  setPaid,
];
