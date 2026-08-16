import { Booking } from '../bookings/entities/booking.entity';

export type BookingNotificationEvent =
  | { type: 'BOOKING_REQUESTED'; booking: Booking }
  | { type: 'BOOKING_ACCEPTED'; booking: Booking }
  | { type: 'BOOKING_REJECTED'; booking: Booking };

/**
 * Port for outgoing booking-lifecycle emails (feature 07).
 *
 * Mirrors `TRIP_NOTIFICATIONS`: the bookings domain depends on this abstraction
 * instead of a concrete SMTP sender, so the domain logic stays testable and
 * feature 07 can swap in the real Mailtrap/Nodemailer transport without
 * touching the booking state transitions. Until then the default implementation
 * only logs.
 */
export const BOOKING_NOTIFICATIONS = Symbol('BOOKING_NOTIFICATIONS');

export interface BookingNotifications {
  notify(event: BookingNotificationEvent): Promise<void>;
}
