import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TripsService } from './trips.service';

/**
 * Scheduled maintenance over the trip lifecycle (FR-TRIP-06).
 *
 * Every hour (a granularity suitable for the demo; the spec only requires a
 * scheduled sweep) it cancels past-deadline trips that never reached their
 * minimum and completes confirmed trips whose departure has passed.
 */
@Injectable()
export class TripSweepJob {
  private readonly logger = new Logger(TripSweepJob.name);

  constructor(private readonly tripsService: TripsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sweep(): Promise<void> {
    try {
      const changed = await this.tripsService.sweepExpired();
      if (changed > 0) {
        this.logger.log(`Lifecycle sweep changed ${changed} trip(s)`);
      }
    } catch (error) {
      // A failed sweep must not crash the scheduler loop.
      this.logger.error('Lifecycle sweep failed', error as Error);
    }
  }
}
