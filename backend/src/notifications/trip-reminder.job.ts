import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { And, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { TripStatus } from '../common/enums';
import { Trip } from '../trips/entities/trip.entity';
import {
  TRIP_NOTIFICATIONS,
  TripNotifications,
} from './trip-notifications.port';

const HOUR_MS = 60 * 60 * 1000;

/**
 * T-24h departure reminder (FR-COMM-01).
 *
 * Runs hourly and emails the driver + confirmed passengers of CONFIRMED trips
 * whose departure falls in `[now+24h, now+25h)`. The 1-hour window matches the
 * cron cadence so each trip is reminded once, without a schema flag.
 */
@Injectable()
export class TripReminderJob {
  private readonly logger = new Logger(TripReminderJob.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @Inject(TRIP_NOTIFICATIONS)
    private readonly notifications: TripNotifications,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async remind(): Promise<void> {
    try {
      const sent = await this.sendDueReminders();
      if (sent > 0) {
        this.logger.log(`T-24h reminder sent for ${sent} trip(s)`);
      }
    } catch (error) {
      this.logger.error('T-24h reminder sweep failed', error as Error);
    }
  }

  async sendDueReminders(now = new Date()): Promise<number> {
    const windowStart = new Date(now.getTime() + 24 * HOUR_MS);
    const windowEnd = new Date(now.getTime() + 25 * HOUR_MS);
    const trips = await this.tripsRepository.find({
      where: {
        status: TripStatus.Confirmed,
        departureAt: And(MoreThanOrEqual(windowStart), LessThan(windowEnd)),
      },
    });

    for (const trip of trips) {
      await this.notifications.notify({ type: 'TRIP_REMINDER', trip });
    }
    return trips.length;
  }
}
