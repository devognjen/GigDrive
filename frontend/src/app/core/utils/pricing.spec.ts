import { calculateLivePrice } from './pricing';

describe('calculateLivePrice', () => {
  describe('SHARED_TOTAL', () => {
    it('matches the README example: 12000 total, min 4, max 8 → band 3000 → 1500', () => {
      const price = calculateLivePrice('SHARED_TOTAL', 12000, 4, 8);
      expect(price.lowerBound).toBe(3000);
      expect(price.upperBound).toBe(1500);
      expect(price.perPerson).toBe(3000);
    });

    it('falls as confirmed seats grow', () => {
      expect(calculateLivePrice('SHARED_TOTAL', 12000, 4, 8, 8).perPerson).toBe(1500);
      expect(calculateLivePrice('SHARED_TOTAL', 12000, 4, 8, 6).perPerson).toBe(2000);
    });

    it('rounds the per-person price up', () => {
      expect(calculateLivePrice('SHARED_TOTAL', 1000, 3, 3, 3).perPerson).toBe(334);
    });
  });

  describe('FIXED_PER_SEAT', () => {
    it('returns a flat price regardless of occupancy', () => {
      const empty = calculateLivePrice('FIXED_PER_SEAT', 1500, 2, 4, 0);
      const full = calculateLivePrice('FIXED_PER_SEAT', 1500, 2, 4, 4);
      expect(empty).toEqual({ perPerson: 1500, lowerBound: 1500, upperBound: 1500 });
      expect(full.perPerson).toBe(1500);
    });
  });
});
