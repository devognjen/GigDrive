import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Observable, Subject, of, throwError } from 'rxjs';

import { TripsActions } from '../../trips/store/trips.actions';
import { buildBooking } from '../../../testing/trip.fixture';
import { BookingService } from '../booking.service';
import { BookingsActions } from './bookings.actions';
import { acceptBooking, loadMine } from './bookings.effects';

describe('bookings effects', () => {
  let actions$: Observable<Action>;
  let actionsSubject: Subject<Action>;
  let bookingService: {
    listMine: ReturnType<typeof vi.fn>;
    accept: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    actionsSubject = new Subject<Action>();
    actions$ = actionsSubject.asObservable();
    bookingService = { listMine: vi.fn(), accept: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: BookingService, useValue: bookingService },
      ],
    });
  });

  it('loads passenger bookings and upserts nested trips', () => {
    const bookings = [buildBooking()];
    bookingService.listMine.mockReturnValue(of(bookings));
    const results: Action[] = [];
    TestBed.runInInjectionContext(() => loadMine()).subscribe((action) => results.push(action));

    actionsSubject.next(BookingsActions.loadMine());

    expect(results).toEqual([
      BookingsActions.loadMineSuccess({ bookings }),
      TripsActions.upsertTrips({ trips: [bookings[0].trip] }),
    ]);
  });

  it('upserts the booking and trip after accept', () => {
    const booking = buildBooking({ status: 'CONFIRMED' });
    bookingService.accept.mockReturnValue(of(booking));
    const results: Action[] = [];
    TestBed.runInInjectionContext(() => acceptBooking()).subscribe((action) =>
      results.push(action),
    );

    actionsSubject.next(BookingsActions.accept({ id: booking.id }));

    expect(results).toEqual([
      BookingsActions.mutationSuccess({ booking }),
      TripsActions.upsertTrip({ trip: booking.trip }),
    ]);
  });

  it('maps a 409 accept error to a capacity message', () => {
    bookingService.accept.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const results: Action[] = [];
    TestBed.runInInjectionContext(() => acceptBooking()).subscribe((action) =>
      results.push(action),
    );

    actionsSubject.next(BookingsActions.accept({ id: 'b1' }));

    expect(results).toEqual([
      BookingsActions.mutationFailure({
        error: 'Could not accept: no seats left for this trip.',
      }),
    ]);
  });
});
