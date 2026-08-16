import { PricingMode } from '../common/enums';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(() => {
    service = new PricingService();
  });

  describe('SHARED_TOTAL mode (PRD §4.1)', () => {
    it('matches the README example: 12000 total, min 4, max 8 → band 3000 → 1500', () => {
      const price = service.calculate(PricingMode.SharedTotal, 12000, 4, 8);
      expect(price.lowerBound).toBe(3000); // 12000 / 4  = 30.00 €
      expect(price.upperBound).toBe(1500); // 12000 / 8  = 15.00 €
      expect(price.perPerson).toBe(3000); // below min → treated as 4
    });

    it('falls as confirmed seats grow, never below the best case', () => {
      const best = service.calculate(PricingMode.SharedTotal, 12000, 4, 8, 8);
      expect(best.perPerson).toBe(1500);

      const partial = service.calculate(
        PricingMode.SharedTotal,
        12000,
        4,
        8,
        6,
      );
      expect(partial.perPerson).toBe(2000); // ceil(12000 / 6)

      const none = service.calculate(PricingMode.SharedTotal, 12000, 4, 8, 0);
      expect(none.perPerson).toBe(3000);
    });

    it('uses minPassengers as the floor divisor when few seats are confirmed', () => {
      const price = service.calculate(PricingMode.SharedTotal, 12000, 4, 8, 1);
      expect(price.perPerson).toBe(3000); // max(4, 1) = 4
    });

    it('rounds the per-person price up (ceil)', () => {
      const price = service.calculate(PricingMode.SharedTotal, 1000, 3, 3, 3);
      expect(price.perPerson).toBe(334); // ceil(1000 / 3)
    });

    it('never divides by zero even with a degenerate min=0', () => {
      const price = service.calculate(PricingMode.SharedTotal, 12000, 0, 8, 0);
      expect(price.perPerson).toBe(12000);
    });
  });

  describe('FIXED_PER_SEAT mode', () => {
    it('returns a flat price regardless of confirmed seats', () => {
      expect(
        service.calculate(PricingMode.FixedPerSeat, 1500, 2, 4, 0).perPerson,
      ).toBe(1500);
      expect(
        service.calculate(PricingMode.FixedPerSeat, 1500, 2, 4, 4).perPerson,
      ).toBe(1500);
    });

    it('uses the same value for the whole band', () => {
      const price = service.calculate(PricingMode.FixedPerSeat, 1500, 2, 4, 2);
      expect(price.lowerBound).toBe(1500);
      expect(price.upperBound).toBe(1500);
    });
  });
});
