import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import {
  BookingEmailContext,
  ConcertSnippet,
  renderBookingEmail,
} from './email-templates';
import { MailerService } from './mailer.service';
import {
  BookingNotificationEvent,
  BookingNotifications,
} from './booking-notifications.port';

/**
 * Booking-lifecycle emails: request → driver; accept/reject → passenger.
 */
@Injectable()
export class EmailBookingNotifications implements BookingNotifications {
  private readonly logger = new Logger(EmailBookingNotifications.name);

  constructor(
    private readonly mailer: MailerService,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
  ) {}

  async notify(event: BookingNotificationEvent): Promise<void> {
    try {
      await this.dispatch(event);
    } catch (error) {
      this.logger.error(
        `[${event.type}] notification failed booking=${event.booking.id}`,
        error as Error,
      );
    }
  }

  private async dispatch(event: BookingNotificationEvent): Promise<void> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: event.booking.id },
      relations: { trip: { concert: true, driver: true }, passenger: true },
    });
    if (!booking) {
      this.logger.warn(
        `[${event.type}] booking=${event.booking.id} not found; skipping`,
      );
      return;
    }

    const recipient = this.resolveRecipient(event.type, booking);
    if (!recipient) {
      this.logger.warn(
        `[${event.type}] booking=${booking.id} missing recipient; skipping`,
      );
      return;
    }

    const message = renderBookingEmail(event.type, {
      ...this.toContext(booking),
      recipientFirstName: recipient.firstName,
    });
    await this.mailer.sendToUser(recipient, message, {
      eventType: event.type,
      entityId: booking.id,
    });
  }

  private resolveRecipient(
    type: BookingNotificationEvent['type'],
    booking: Booking,
  ): User | undefined {
    if (type === 'BOOKING_REQUESTED') {
      return booking.trip?.driver;
    }
    return booking.passenger;
  }

  private toContext(
    booking: Booking,
  ): Omit<BookingEmailContext, 'recipientFirstName'> {
    const trip = booking.trip;
    const driver = trip?.driver;
    const passenger = booking.passenger;
    return {
      driverName: displayName(driver, 'the driver'),
      passengerName: displayName(passenger, 'a passenger'),
      seats: booking.seats,
      concert: concertSnippet(trip),
      departureAt: trip?.departureAt ?? new Date(),
    };
  }
}

function displayName(user: User | undefined, fallback: string): string {
  if (!user) {
    return fallback;
  }
  return `${user.firstName} ${user.lastName}`.trim();
}

function concertSnippet(trip: Booking['trip'] | undefined): ConcertSnippet {
  const concert = trip?.concert;
  return {
    artist: concert?.artist ?? 'your concert',
    city: concert?.city ?? 'the destination',
    venue: concert?.venue ?? 'the venue',
    startAt: concert?.startAt ?? trip?.departureAt ?? new Date(),
  };
}
