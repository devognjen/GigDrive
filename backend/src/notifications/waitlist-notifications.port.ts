import { WaitlistEntry } from '../waitlist/entities/waitlist-entry.entity';

export type WaitlistNotificationEvent = {
  type: 'WAITLIST_SEAT_AVAILABLE';
  entry: WaitlistEntry;
  position: number;
};

/**
 * Port for outgoing waitlist emails (FR-BOOK-05).
 *
 * Waitlist depends on this abstraction rather than on a concrete SMTP sender,
 * so the domain logic stays testable and the Mailtrap/Nodemailer module can
 * be swapped without touching join/leave or the cancel hook.
 */
export const WAITLIST_NOTIFICATIONS = Symbol('WAITLIST_NOTIFICATIONS');

export interface WaitlistNotifications {
  notify(event: WaitlistNotificationEvent): Promise<void>;
}
