import { Injectable, Logger } from '@nestjs/common';
import {
  TripNotificationEvent,
  TripNotifications,
} from './trip-notifications.port';

/**
 * Placeholder implementation of the trip-notifications port.
 *
 * Keeps trip state transitions decoupled from email delivery. Emits a
 * structured log line for now; feature 07 will replace this provider with the
 * real Mailtrap/Nodemailer-backed service (honoring the per-user email
 * preference).
 */
@Injectable()
export class LoggingTripNotifications implements TripNotifications {
  private readonly logger = new Logger('TripNotifications');

  async notify(event: TripNotificationEvent): Promise<void> {
    this.logger.log(
      `[${event.type}] trip=${event.trip.id} driver=${event.trip.driverId}`,
    );
  }
}
