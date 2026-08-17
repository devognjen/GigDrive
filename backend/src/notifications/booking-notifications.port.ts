import { Booking } from '../bookings/entities/booking.entity';

export type BookingNotificationEvent =
  | { type: 'BOOKING_REQUESTED'; booking: Booking }
  | { type: 'BOOKING_ACCEPTED'; booking: Booking }
  | { type: 'BOOKING_REJECTED'; booking: Booking };

/**
 * Port for outgoing booking-lifecycle emails.
 *
 * Mirrors `TRIP_NOTIFICATIONS`: the bookings domain depends on this abstraction
 * instead of a concrete SMTP sender, so the domain logic stays testable and
 * the Mailtrap/Nodemailer transport can be swapped without touching booking
 * state transitions.
 */
export const BOOKING_NOTIFICATIONS = Symbol('BOOKING_NOTIFICATIONS');

export interface BookingNotifications {
  notify(event: BookingNotificationEvent): Promise<void>;
}
