import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TRIP_NOTIFICATIONS,
  TripNotifications,
} from '../../notifications/trip-notifications.port';
import { Trip } from '../../trips/entities/trip.entity';
import { SignalService } from './signal.service';

/**
 * Builds the Signal group title from concert fields (FR-COMM-03):
 * `🎵 {Artist} — {City}, {date}`.
 */
export function signalGroupName(
  artist: string,
  city: string,
  startAt: Date,
): string {
  const date = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(startAt);
  return `🎵 ${artist} — ${city}, ${date}`;
}

/**
 * Feature-flagged hook for READY→CONFIRMED: create a Signal group, then email
 * the invite link. Failures are logged and swallowed so confirmation proceeds.
 */
@Injectable()
export class SignalAutomationService {
  private readonly logger = new Logger(SignalAutomationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly signal: SignalService,
    @Inject(TRIP_NOTIFICATIONS)
    private readonly notifications: TripNotifications,
  ) {}

  /** Whether Signal group automation is enabled (`FEATURE_SIGNAL`). */
  isEnabled(): boolean {
    return this.config.get<boolean>('features.signal') === true;
  }

  async onTripConfirmed(trip: Trip): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    if (!this.signal.isConfigured()) {
      this.logger.warn(
        `FEATURE_SIGNAL is on but SIGNAL_NUMBER is missing; skipping trip=${trip.id}`,
      );
      return;
    }

    try {
      await this.createAndEmail(trip);
    } catch (error) {
      this.logger.error(
        `Signal automation failed trip=${trip.id}`,
        error as Error,
      );
    }
  }

  private async createAndEmail(trip: Trip): Promise<void> {
    const artist = trip.concert?.artist ?? 'Concert';
    const city = trip.concert?.city ?? 'Unknown';
    const startAt = trip.concert?.startAt ?? trip.departureAt;
    const groupName = signalGroupName(artist, city, startAt);

    const group = await this.signal.createGroupWithInvite(groupName);
    if (!group) {
      this.logger.warn(
        `Signal group was not created for trip=${trip.id}; confirmation continues`,
      );
      return;
    }

    await this.notifications.notify({
      type: 'SIGNAL_INVITE',
      trip,
      inviteLink: group.inviteLink,
      groupName: group.name,
    });
  }
}
