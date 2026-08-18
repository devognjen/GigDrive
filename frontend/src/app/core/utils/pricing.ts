import { LivePrice, PricingMode } from '../models/trip.model';

/**
 * Pure dynamic-pricing logic matching the API (PRD §4.1).
 *
 * For SHARED_TOTAL the price is `ceil(totalCost / max(min, confirmed))`;
 * for FIXED_PER_SEAT the price is a flat `totalCost` per seat.
 * Amounts are minor currency units.
 */
export function calculateLivePrice(
  mode: PricingMode,
  totalCost: number,
  minPassengers: number,
  maxPassengers: number,
  confirmedSeats = 0,
): LivePrice {
  if (mode === 'FIXED_PER_SEAT') {
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
