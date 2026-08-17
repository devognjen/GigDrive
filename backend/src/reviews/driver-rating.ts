/** Aggregated rating of a user in their driver role. */
export interface DriverRating {
  averageRating: number | null;
  reviewCount: number;
}

export const EMPTY_DRIVER_RATING: DriverRating = {
  averageRating: null,
  reviewCount: 0,
};

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
