import { Dictionary } from '@ngrx/entity';

import { Booking } from '../../core/models/booking.model';
import { Currency, Trip } from '../../core/models/trip.model';
import { formatMoney } from '../../core/utils/money';

export { formatMoney };

/** Per-currency earnings from confirmed bookings. Amounts are minor units. */
export interface CurrencyEarnings {
  currency: Currency;
  total: number;
  paid: number;
  unpaid: number;
}

/**
 * Map/reduce aggregation of driver earnings: confirmed booking seats times the
 * trip's live per-person price, grouped by currency and split paid vs unpaid.
 */
export function aggregateEarnings(
  bookings: Booking[],
  tripsById: Dictionary<Trip>,
): CurrencyEarnings[] {
  const byCurrency = bookings
    .filter((booking) => booking.status === 'CONFIRMED')
    .map((booking) => {
      const trip = tripsById[booking.tripId] ?? booking.trip;
      if (!trip) {
        return null;
      }
      return {
        currency: trip.currency,
        amount: booking.seats * trip.livePrice.perPerson,
        paid: booking.paid,
      };
    })
    .filter((row): row is { currency: Currency; amount: number; paid: boolean } => row !== null)
    .reduce((acc, row) => {
      const current = acc.get(row.currency) ?? {
        currency: row.currency,
        total: 0,
        paid: 0,
        unpaid: 0,
      };
      current.total += row.amount;
      if (row.paid) {
        current.paid += row.amount;
      } else {
        current.unpaid += row.amount;
      }
      acc.set(row.currency, current);
      return acc;
    }, new Map<Currency, CurrencyEarnings>());

  return [...byCurrency.values()];
}
