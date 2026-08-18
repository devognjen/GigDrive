import { TripStatus } from '../common/enums';

/** Statuses hidden from public trip browse so retired rides do not compete. */
export const BROWSE_HIDDEN_STATUSES: TripStatus[] = [
  TripStatus.Cancelled,
  TripStatus.Completed,
];

export function isTerminalTripStatus(status: TripStatus): boolean {
  return (
    status === TripStatus.Cancelled || status === TripStatus.Completed
  );
}

/** Upcoming/active trips first, then terminal; each group by departure ascending. */
export function compareTripsActiveFirst(
  a: { status: TripStatus; departureAt: Date },
  b: { status: TripStatus; departureAt: Date },
): number {
  const aTerm = isTerminalTripStatus(a.status) ? 1 : 0;
  const bTerm = isTerminalTripStatus(b.status) ? 1 : 0;
  if (aTerm !== bTerm) {
    return aTerm - bTerm;
  }
  return a.departureAt.getTime() - b.departureAt.getTime();
}
