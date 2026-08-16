import { Injectable } from '@nestjs/common';
import { PricingMode } from '../common/enums';

/**
 * Result of a live-price calculation for a shared trip.
 */
export interface LivePrice {
  /** Current per-person price in the trip's currency minor units. */
  perPerson: number;
  /** Worst-case per-person price (totalCost / minPassengers). */
  lowerBound: number;
  /** Best-case per-person price (totalCost / maxPassengers). */
  upperBound: number;
}

/**
 * Pure dynamic-pricing logic (PRD §4.1).
 *
 * The "price band" is [lowerBound, upperBound]:
 *   - lowerBound (guaranteed max, the worst case) is price at `minPassengers`,
 *   - upperBound (full vehicle, the best case) is price at `maxPassengers`.
 *
 * The naming is intentional and matches the shared-ride domain: as more
 * passengers confirm the per-person price *falls*, so the band is read from
 * the expensive end (lowerBound) down to the cheap end (upperBound).
 *
 * For SHARED_TOTAL the price is `ceil(totalCost / max(min, confirmed))`;
 * for FIXED_PER_SEAT the price is a flat `totalCost` per seat regardless of
 * how many passengers confirm (no division).
 *
 * `confirmedSeats` is the number of already-reserved seats confirmed by the
 * driver (sum of CONFIRMED bookings); `max/min` are the trip's go/no-go and
 * capacity thresholds. Keeping this calculation isolated in a dedicated
 * service makes it trivially unit-testable.
 */
@Injectable()
export class PricingService {
  calculate(
    mode: PricingMode,
    totalCost: number,
    minPassengers: number,
    maxPassengers: number,
    confirmedSeats = 0,
  ): LivePrice {
    if (mode === PricingMode.FixedPerSeat) {
      return {
        perPerson: totalCost,
        lowerBound: totalCost,
        upperBound: totalCost,
      };
    }

    const divisor = Math.max(minPassengers, confirmedSeats, 1);
    const perPerson = Math.ceil(totalCost / divisor);
    return {
      perPerson,
      lowerBound: Math.ceil(totalCost / minPassengers),
      upperBound: Math.ceil(totalCost / maxPassengers),
    };
  }
}
