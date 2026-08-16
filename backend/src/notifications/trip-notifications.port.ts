import { Trip } from '../trips/entities/trip.entity';

export interface TripNotificationEvent {
  type:
    | 'TRIP_READY'
    | 'TRIP_CONFIRMED'
    | 'TRIP_CANCELLED'
    | 'TRIP_COMPLETED';
  trip: Trip;
}

/**
 * Port for outgoing trip-lifecycle emails (feature 07).
 *
 * Trips depends on this abstraction rather than on a concrete SMTP sender, so
 * the domain logic is testable and the future Mailtrap/Nodemailer module can
 * be swapped in without touching the trip state machine. Until feature 07
 * lands, the default implementation only logs.
 */
export const TRIP_NOTIFICATIONS = Symbol('TRIP_NOTIFICATIONS');

export interface TripNotifications {
  notify(event: TripNotificationEvent): Promise<void>;
}
