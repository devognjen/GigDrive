import { Trip } from './trip.model';

/** Booking status as defined by the API. */
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED_BY_PASSENGER';

/** Booking as returned by the API. */
export interface Booking {
  id: string;
  tripId: string;
  passengerId: string;
  /** Display name of the passenger. */
  passengerName: string;
  seats: number;
  status: BookingStatus;
  /** Informational paid flag (driver-set). */
  paid: boolean;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp or null. */
  decidedAt: string | null;
  /** Nested trip with live price and concert summary. */
  trip: Trip;
}

/** Payload for POST /trips/:id/bookings. */
export interface CreateBookingRequest {
  seats: number;
}
