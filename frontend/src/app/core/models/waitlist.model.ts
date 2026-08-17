import { Trip } from './trip.model';

/** Waitlist entry as returned by the API. */
export interface WaitlistEntry {
  id: string;
  tripId: string;
  passengerId: string;
  seats: number;
  /** 1-based position in join order on this trip. */
  position: number;
  /** ISO 8601 timestamp. */
  createdAt: string;
  trip: Trip;
}

/** Payload for POST /trips/:id/waitlist. */
export interface CreateWaitlistRequest {
  seats: number;
}
