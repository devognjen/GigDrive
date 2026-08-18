import { TripStatus } from '../common/enums';
import { compareTripsActiveFirst, isTerminalTripStatus } from './trip-listing';

describe('trip-listing', () => {
  describe('isTerminalTripStatus', () => {
    it('treats cancelled and completed as terminal', () => {
      expect(isTerminalTripStatus(TripStatus.Cancelled)).toBe(true);
      expect(isTerminalTripStatus(TripStatus.Completed)).toBe(true);
      expect(isTerminalTripStatus(TripStatus.Open)).toBe(false);
    });
  });

  describe('compareTripsActiveFirst', () => {
    it('orders active trips before terminal, then by departure', () => {
      const cancelled = {
        status: TripStatus.Cancelled,
        departureAt: new Date('2026-07-01T10:00:00Z'),
      };
      const laterOpen = {
        status: TripStatus.Open,
        departureAt: new Date('2026-07-01T18:00:00Z'),
      };
      const soonerOpen = {
        status: TripStatus.Open,
        departureAt: new Date('2026-07-01T12:00:00Z'),
      };

      const sorted = [cancelled, laterOpen, soonerOpen].sort(
        compareTripsActiveFirst,
      );

      expect(sorted).toEqual([soonerOpen, laterOpen, cancelled]);
    });
  });
});
