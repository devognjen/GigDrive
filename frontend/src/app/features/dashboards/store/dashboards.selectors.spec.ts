import { bookingsAdapter } from '../../bookings/store/bookings.reducer';
import { tripsAdapter } from '../../trips/store/trips.reducer';
import { buildBooking, buildTrip } from '../../../testing/trip.fixture';
import {
  selectEarnings,
  selectPendingRequests,
  selectPassengerBookings,
} from './dashboards.selectors';

describe('dashboard selectors', () => {
  const eurTrip = buildTrip({
    confirmedSeats: 2,
    livePrice: { perPerson: 2000, lowerBound: 3000, upperBound: 1500 },
  });
  const pending = buildBooking({ id: 'b1', status: 'PENDING', trip: eurTrip });
  const confirmed = buildBooking({
    id: 'b2',
    status: 'CONFIRMED',
    seats: 2,
    paid: true,
    trip: eurTrip,
  });

  const bookings = bookingsAdapter.getSelectors().selectAll(
    bookingsAdapter.setAll(
      [pending, confirmed],
      bookingsAdapter.getInitialState({
        loading: false,
        loaded: true,
        error: null,
        pendingId: null,
      }),
    ),
  );
  const tripEntities = tripsAdapter
    .getSelectors()
    .selectEntities(
      tripsAdapter.setAll(
        [eurTrip],
        tripsAdapter.getInitialState({ loading: false, loaded: true, error: null }),
      ),
    );

  it('filters pending incoming requests', () => {
    const joined = selectPassengerBookings.projector(bookings, tripEntities);
    expect(selectPendingRequests.projector(joined).map((booking) => booking.id)).toEqual(['b1']);
  });

  it('joins passenger bookings with live trip data', () => {
    const views = selectPassengerBookings.projector(bookings, tripEntities);
    expect(views[1].trip.livePrice.perPerson).toBe(2000);
    expect(views).toHaveLength(2);
  });

  it('aggregates earnings from confirmed bookings', () => {
    expect(selectEarnings.projector(bookings, tripEntities)).toEqual([
      { currency: 'EUR', total: 4000, paid: 4000, unpaid: 0 },
    ]);
  });
});
