import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Concert } from '../concerts/entities/concert.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { WaitlistEntry } from '../waitlist/entities/waitlist-entry.entity';
import {
  ConcertSnippet,
  renderWaitlistEmail,
  WaitlistEmailContext,
} from './email-templates';
import { MailerService } from './mailer.service';
import {
  WaitlistNotificationEvent,
  WaitlistNotifications,
} from './waitlist-notifications.port';

/**
 * Waitlist emails: a freed seat notifies each waitlisted passenger in join
 * order. Membership does not reserve the seat.
 */
@Injectable()
export class EmailWaitlistNotifications implements WaitlistNotifications {
  private readonly logger = new Logger(EmailWaitlistNotifications.name);

  constructor(
    private readonly mailer: MailerService,
    @InjectRepository(WaitlistEntry)
    private readonly waitlistRepository: Repository<WaitlistEntry>,
  ) {}

  async notify(event: WaitlistNotificationEvent): Promise<void> {
    try {
      await this.dispatch(event);
    } catch (error) {
      this.logger.error(
        `[${event.type}] notification failed entry=${event.entry.id}`,
        error as Error,
      );
    }
  }

  private async dispatch(event: WaitlistNotificationEvent): Promise<void> {
    const entry = await this.waitlistRepository.findOne({
      where: { id: event.entry.id },
      relations: { trip: { concert: true, driver: true }, passenger: true },
    });
    if (!entry) {
      this.logger.warn(
        `[${event.type}] entry=${event.entry.id} not found; skipping`,
      );
      return;
    }

    const recipient = entry.passenger;
    if (!recipient) {
      this.logger.warn(
        `[${event.type}] entry=${entry.id} missing passenger; skipping`,
      );
      return;
    }

    const message = renderWaitlistEmail(event.type, {
      ...this.toContext(entry, event.position),
      recipientFirstName: recipient.firstName,
    });
    await this.mailer.sendToUser(recipient, message, {
      eventType: event.type,
      entityId: entry.id,
    });
  }

  private toContext(
    entry: WaitlistEntry,
    position: number,
  ): Omit<WaitlistEmailContext, 'recipientFirstName'> {
    const trip = entry.trip;
    const driver = trip?.driver;
    return {
      driverName: displayName(driver, 'the driver'),
      concert: concertSnippet(trip),
      departureAt: trip?.departureAt ?? new Date(),
      position,
      seats: entry.seats,
    };
  }
}

function displayName(user: User | undefined, fallback: string): string {
  if (!user) {
    return fallback;
  }
  return `${user.firstName} ${user.lastName}`.trim();
}

function concertSnippet(trip: Trip | undefined): ConcertSnippet {
  const concert: Concert | undefined = trip?.concert;
  return {
    artist: concert?.artist ?? 'your concert',
    city: concert?.city ?? 'the destination',
    venue: concert?.venue ?? 'the venue',
    startAt: concert?.startAt ?? trip?.departureAt ?? new Date(),
  };
}
