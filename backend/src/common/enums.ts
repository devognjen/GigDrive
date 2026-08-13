/**
 * Domain enums, kept as plain TypeScript enums (module-level, not DB-dependent).
 * Stored in the database as varchar values.
 */

export enum VehicleType {
  Car = 'CAR',
  Van = 'VAN',
  Minibus = 'MINIBUS',
}

export enum TripStatus {
  Open = 'OPEN',
  Full = 'FULL',
  Ready = 'READY',
  Confirmed = 'CONFIRMED',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export enum BookingStatus {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Rejected = 'REJECTED',
  CancelledByPassenger = 'CANCELLED_BY_PASSENGER',
}

export enum PricingMode {
  SharedTotal = 'SHARED_TOTAL',
  FixedPerSeat = 'FIXED_PER_SEAT',
}

export enum Currency {
  Eur = 'EUR',
  Rsd = 'RSD',
}
