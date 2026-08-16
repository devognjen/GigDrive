import { Injectable, Logger } from '@nestjs/common';
import {
  BookingNotificationEvent,
  BookingNotifications,
} from './booking-notifications.port';

/**
 * Placeholder implementation of the booking-notifications port.
 *
 * Keeps booking state transitions decoupled from email delivery. Emits a
 * structured log line for now; feature 07 replaces this provider with the real
 * Mailtrap/Nodemailer-backed service (honoring the per-user email preference).
 */
@Injectable()
export class LoggingBookingNotifications implements BookingNotifications {
  private readonly logger = new Logger('BookingNotifications');

  notify(event: BookingNotificationEvent): Promise<void> {
    this.logger.log(
      `[${event.type}] booking=${event.booking.id} trip=${event.booking.tripId} passenger=${event.booking.passengerId}`,
    );
    return Promise.resolve();
  }
}
