import { BookingStatus, PricingMode, TripStatus } from '../common/enums';
import { buildSeedData } from './seed-data';

describe('buildSeedData', () => {
  const data = buildSeedData(new Date('2026-08-13T12:00:00Z'), 'hash');

  it('produces a demo driver and passengers with the same password hash', () => {
    expect(data.driver.email).toBe('driver@gigdrive.demo');
    expect(data.passengers).toHaveLength(3);
    for (const user of [data.driver, ...data.passengers]) {
      expect(user.passwordHash).toBe('hash');
    }
  });

  it('creates cached concerts with unique external ids', () => {
    const now = new Date('2026-08-13T12:00:00Z');
    const externalIds = data.concerts.map((c) => c.externalId);
    expect(new Set(externalIds).size).toBe(data.concerts.length);
    const future = data.concerts.filter(
      (c) => c.startAt.getTime() > now.getTime(),
    );
    const past = data.concerts.filter(
      (c) => c.startAt.getTime() < now.getTime(),
    );
    expect(future.length).toBeGreaterThan(0);
    expect(past).toHaveLength(1);
  });

  it('builds a nearly-full, open trip consistent with PRD §4 rules', () => {
    const { trip, vehicles, bookings } = data;
    const van = vehicles.find((v) => v.id === trip.vehicleId);

    expect(trip.status).toBe(TripStatus.Open);
    expect(trip.pricingMode).toBe(PricingMode.SharedTotal);
    expect(trip.minPassengers).toBeLessThanOrEqual(trip.maxPassengers);
    expect(trip.maxPassengers).toBeLessThanOrEqual(van!.seats);
    expect(trip.confirmationDeadline.getTime()).toBeLessThan(
      data.concerts[0].startAt.getTime(),
    );

    const confirmedSeats = bookings
      .filter(
        (b) => b.tripId === trip.id && b.status === BookingStatus.Confirmed,
      )
      .reduce((sum, b) => sum + b.seats, 0);
    expect(confirmedSeats).toBe(trip.maxPassengers - 1);
    expect(confirmedSeats).toBeGreaterThanOrEqual(trip.minPassengers);
  });

  it('numbers trip stops sequentially', () => {
    const headlineStops = data.stops.filter((s) => s.tripId === data.trip.id);
    expect(headlineStops.map((s) => s.seq)).toEqual([1, 2]);
    for (const stop of headlineStops) {
      expect(stop.tripId).toBe(data.trip.id);
    }
  });

  it('seeds a completed past trip with reviews of the demo driver', () => {
    expect(data.pastTrip.status).toBe(TripStatus.Completed);
    expect(data.pastTrip.driverId).toBe(data.driver.id);
    expect(data.reviews).toHaveLength(2);
    expect(data.reviews.every((r) => r.tripId === data.pastTrip.id)).toBe(true);
    const average =
      data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length;
    expect(average).toBe(4.5);
  });
});
