import { Trip } from '../trips/entities/trip.entity';

type TripLifecycleEvent = {
  type:
    | 'TRIP_READY'
    | 'TRIP_CONFIRMED'
    | 'TRIP_CANCELLED'
    | 'TRIP_COMPLETED'
    | 'TRIP_REMINDER';
  trip: Trip;
};

type SignalInviteEvent = {
  type: 'SIGNAL_INVITE';
  trip: Trip;
  inviteLink: string;
  groupName: string;
};

export type TripNotificationEvent = TripLifecycleEvent | SignalInviteEvent;

/**
 * Port for outgoing trip-lifecycle emails.
 *
 * Trips depends on this abstraction rather than on a concrete SMTP sender, so
 * the domain logic stays testable and the Mailtrap/Nodemailer module can be
 * swapped without touching the trip state machine.
 */
export const TRIP_NOTIFICATIONS = Symbol('TRIP_NOTIFICATIONS');

export interface TripNotifications {
  notify(event: TripNotificationEvent): Promise<void>;
}
