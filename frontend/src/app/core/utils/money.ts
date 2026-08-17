import { Currency } from '../models/trip.model';

/** Formats a minor-units amount for display. */
export function formatMoney(minorUnits: number, currency: Currency = 'EUR'): string {
  const amount = (minorUnits / 100).toFixed(2);
  return currency === 'EUR' ? `${amount} €` : `${amount} ${currency}`;
}
