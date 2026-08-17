import { buildBooking, buildTrip } from '../../testing/trip.fixture';
import { aggregateEarnings, formatMoney } from './earnings';

describe('aggregateEarnings', () => {
  it('returns an empty list when there are no confirmed bookings', () => {
    expect(aggregateEarnings([buildBooking()], { t1: buildTrip() })).toEqual([]);
  });

  it('maps seats times live price and reduces per currency', () => {
    const eurTrip = buildTrip({
      id: 't1',
      currency: 'EUR',
      livePrice: { perPerson: 3000, lowerBound: 3000, upperBound: 1500 },
    });
    const rsdTrip = buildTrip({
      id: 't2',
      currency: 'RSD',
      livePrice: { perPerson: 1000, lowerBound: 1000, upperBound: 500 },
    });
    const bookings = [
      buildBooking({
        id: 'b1',
        tripId: 't1',
        seats: 2,
        status: 'CONFIRMED',
        paid: true,
        trip: eurTrip,
      }),
      buildBooking({
        id: 'b2',
        tripId: 't1',
        seats: 1,
        status: 'CONFIRMED',
        paid: false,
        trip: eurTrip,
      }),
      buildBooking({
        id: 'b3',
        tripId: 't2',
        seats: 3,
        status: 'CONFIRMED',
        paid: false,
        trip: rsdTrip,
      }),
      buildBooking({ id: 'b4', tripId: 't1', status: 'PENDING', trip: eurTrip }),
    ];

    expect(aggregateEarnings(bookings, { t1: eurTrip, t2: rsdTrip })).toEqual([
      { currency: 'EUR', total: 9000, paid: 6000, unpaid: 3000 },
      { currency: 'RSD', total: 3000, paid: 0, unpaid: 3000 },
    ]);
  });

  it('falls back to the nested trip when the entity is missing', () => {
    const trip = buildTrip({ livePrice: { perPerson: 1500, lowerBound: 3000, upperBound: 1500 } });
    const bookings = [buildBooking({ status: 'CONFIRMED', seats: 2, paid: false, trip })];
    expect(aggregateEarnings(bookings, {})).toEqual([
      { currency: 'EUR', total: 3000, paid: 0, unpaid: 3000 },
    ]);
  });
});

describe('formatMoney', () => {
  it('formats EUR with a symbol', () => {
    expect(formatMoney(3000, 'EUR')).toBe('30.00 €');
  });

  it('formats other currencies with the code', () => {
    expect(formatMoney(1500, 'RSD')).toBe('15.00 RSD');
  });
});
