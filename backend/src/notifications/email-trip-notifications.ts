import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BookingStatus } from '../common/enums';
import { Booking } from '../bookings/entities/booking.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import {
  ConcertSnippet,
  TripEmailContext,
  TripMailEvent,
  renderTripEmail,
} from './email-templates';
import { MailerService } from './mailer.service';
import {
  TripNotificationEvent,
  TripNotifications,
} from './trip-notifications.port';

const CONFIRMED_ONLY = [BookingStatus.Confirmed];
const CONFIRMED_AND_PENDING = [BookingStatus.Confirmed, BookingStatus.Pending];

/**
 * Trip-lifecycle emails: READY (driver), CONFIRMED / T-24h / Signal invite
 * (driver + confirmed passengers), CANCELLED (driver + confirmed and pending
 * passengers). COMPLETED is logged only — it is not part of FR-COMM-01.
 */
@Injectable()
export class EmailTripNotifications implements TripNotifications {
  private readonly logger = new Logger(EmailTripNotifications.name);

  constructor(
    private readonly mailer: MailerService,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
  ) {}

  async notify(event: TripNotificationEvent): Promise<void> {
    try {
      await this.dispatch(event);
    } catch (error) {
      this.logger.error(
        `[${event.type}] notification failed trip=${event.trip.id}`,
        error as Error,
      );
    }
  }

  private async dispatch(event: TripNotificationEvent): Promise<void> {
    if (event.type === 'TRIP_COMPLETED') {
      this.logger.log(`[TRIP_COMPLETED] trip=${event.trip.id} (no email)`);
      return;
    }

    const trip = await this.tripsRepository.findOne({
      where: { id: event.trip.id },
      relations: { concert: true, driver: true },
    });
    if (!trip) {
      this.logger.warn(
        `[${event.type}] trip=${event.trip.id} not found; skipping`,
      );
      return;
    }

    const recipients = await this.resolveRecipients(event.type, trip);
    const base = this.toContext(trip, event);

    for (const user of recipients) {
      const message = renderTripEmail(event.type, {
        ...base,
        recipientFirstName: user.firstName,
      });
      await this.mailer.sendToUser(user, message, {
        eventType: event.type,
        entityId: trip.id,
      });
    }
  }

  private async resolveRecipients(
    type: TripMailEvent,
    trip: Trip,
  ): Promise<User[]> {
    const driver = trip.driver;
    switch (type) {
      case 'TRIP_READY':
        return uniqueUsers([driver]);
      case 'TRIP_CONFIRMED':
      case 'TRIP_REMINDER':
      case 'SIGNAL_INVITE':
        return uniqueUsers([
          driver,
          ...(await this.loadPassengers(trip.id, CONFIRMED_ONLY)),
        ]);
      case 'TRIP_CANCELLED':
        return uniqueUsers([
          driver,
          ...(await this.loadPassengers(trip.id, CONFIRMED_AND_PENDING)),
        ]);
    }
  }

  private async loadPassengers(
    tripId: string,
    statuses: BookingStatus[],
  ): Promise<User[]> {
    const bookings = await this.bookingsRepository.find({
      where: { tripId, status: In(statuses) },
      relations: { passenger: true },
    });
    return bookings.map((booking) => booking.passenger);
  }

  private toContext(
    trip: Trip,
    event: Exclude<TripNotificationEvent, { type: 'TRIP_COMPLETED' }>,
  ): Omit<TripEmailContext, 'recipientFirstName'> {
    return {
      driverName: displayName(trip.driver),
      concert: concertSnippet(trip),
      departureAt: trip.departureAt,
      ...(event.type === 'SIGNAL_INVITE'
        ? { inviteLink: event.inviteLink, groupName: event.groupName }
        : {}),
    };
  }
}

function uniqueUsers(users: Array<User | null | undefined>): User[] {
  const seen = new Set<string>();
  const result: User[] = [];
  for (const user of users) {
    if (!user || seen.has(user.id)) {
      continue;
    }
    seen.add(user.id);
    result.push(user);
  }
  return result;
}

function displayName(user: User | undefined): string {
  if (!user) {
    return 'the driver';
  }
  return `${user.firstName} ${user.lastName}`.trim();
}

function concertSnippet(trip: Trip): ConcertSnippet {
  const concert = trip.concert;
  return {
    artist: concert?.artist ?? 'your concert',
    city: concert?.city ?? 'the destination',
    venue: concert?.venue ?? 'the venue',
    startAt: concert?.startAt ?? trip.departureAt,
  };
}
