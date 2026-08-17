import { Booking } from '../core/models/booking.model';
import { Trip } from '../core/models/trip.model';

/** Shared trip used by store and dashboard tests. */
export function buildTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    driverId: 'd1',
    driverName: 'Demo Driver',
    driverAverageRating: null,
    driverReviewCount: 0,
    vehicleId: 'v1',
    vehicleType: 'VAN',
    concertId: 'c1',
    concertArtist: 'The Demo Band',
    concertTitle: 'Summer Open Air',
    concertCity: 'Novi Sad',
    pricingMode: 'SHARED_TOTAL',
    totalCost: 12000,
    currency: 'EUR',
    minPassengers: 4,
    maxPassengers: 8,
    confirmationDeadline: '2026-09-01T00:00:00.000Z',
    departureAt: '2026-09-10T00:00:00.000Z',
    roundTrip: false,
    notes: null,
    status: 'OPEN',
    confirmedSeats: 0,
    seatsLeft: 8,
    stops: [],
    livePrice: { perPerson: 3000, lowerBound: 3000, upperBound: 1500 },
    ...overrides,
  };
}

/** Shared booking used by store and dashboard tests. */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  const trip = overrides.trip ?? buildTrip();
  return {
    id: 'b1',
    tripId: trip.id,
    passengerId: 'p1',
    passengerName: 'Pat Passenger',
    seats: 2,
    status: 'PENDING',
    paid: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    decidedAt: null,
    trip,
    canReview: false,
    ...overrides,
  };
}
