import { BookingStatus, TripStatus } from '../common/enums';

export type StatusCountRow = { status: string; count: string | number };

/**
 * Fills every known status with a count (default 0). Used for admin KPIs so
 * missing group-by rows still appear as zero.
 */
export function tallyByStatus<T extends string>(
  rows: StatusCountRow[],
  statuses: readonly T[],
): Record<T, number> {
  const counted = rows.reduce<Partial<Record<string, number>>>((acc, row) => {
    acc[row.status] = Number(row.count);
    return acc;
  }, {});
  return statuses.reduce(
    (acc, status) => {
      acc[status] = counted[status] ?? 0;
      return acc;
    },
    {} as Record<T, number>,
  );
}

export const ALL_TRIP_STATUSES = Object.values(TripStatus);
export const ALL_BOOKING_STATUSES = Object.values(BookingStatus);
