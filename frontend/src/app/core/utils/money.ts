import { Currency } from '../models/trip.model';

/** Formats a minor-units amount for display. */
export function formatMoney(minorUnits: number, currency: Currency = 'EUR'): string {
  const amount = fromMinorUnits(minorUnits).toFixed(2);
  return currency === 'EUR' ? `${amount} €` : `${amount} ${currency}`;
}

/** Converts a human-facing amount (e.g. 120.00) to integer minor units. */
export function toMinorUnits(majorUnits: number): number {
  return Math.round(majorUnits * 100);
}

/** Converts integer minor units to a human-facing amount. */
export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / 100;
}
