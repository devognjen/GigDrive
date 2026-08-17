import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus, TripStatus } from '../common/enums';
import {
  WAITLIST_NOTIFICATIONS,
  WaitlistNotifications,
} from '../notifications/waitlist-notifications.port';
import { Trip } from '../trips/entities/trip.entity';
import { TripsService } from '../trips/trips.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { WaitlistEntryDto } from './dto/waitlist-entry.dto';
import { WaitlistEntry } from './entities/waitlist-entry.entity';

const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.Pending,
  BookingStatus.Confirmed,
];

/**
 * Waitlist for FULL trips (FR-BOOK-05). Membership never occupies seats or
 * changes live price; a freed confirmed seat only triggers notification.
 */
@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    @InjectRepository(WaitlistEntry)
    private readonly waitlistRepository: Repository<WaitlistEntry>,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly tripsService: TripsService,
    @Inject(WAITLIST_NOTIFICATIONS)
    private readonly notifications: WaitlistNotifications,
  ) {}

  async join(
    tripId: string,
    passengerId: string,
    dto: CreateWaitlistDto,
  ): Promise<WaitlistEntryDto> {
    const trip = await this.findTripOrFail(tripId);
    if (trip.driverId === passengerId) {
      throw new ConflictException('The driver cannot join their own waitlist');
    }
    if (trip.status !== TripStatus.Full) {
      throw new ConflictException(
        'The waitlist is only open while the trip is FULL',
      );
    }
    if (dto.seats > trip.maxPassengers) {
      throw new ConflictException('Requested seats exceed the trip capacity');
    }

    const existing = await this.waitlistRepository.findOneBy({
      tripId,
      passengerId,
    });
    if (existing) {
      throw new ConflictException('You are already on the waitlist');
    }

    await this.assertNoActiveBooking(tripId, passengerId);

    const saved = await this.waitlistRepository.save(
      this.waitlistRepository.create({
        tripId,
        passengerId,
        seats: dto.seats,
      }),
    );
    return this.toDto(saved, await this.positionOf(saved));
  }

  async leave(tripId: string, passengerId: string): Promise<void> {
    const entry = await this.waitlistRepository.findOneBy({
      tripId,
      passengerId,
    });
    if (!entry) {
      throw new NotFoundException('Waitlist entry not found');
    }
    await this.waitlistRepository.remove(entry);
  }

  async listMine(passengerId: string): Promise<WaitlistEntryDto[]> {
    const mine = await this.waitlistRepository.find({
      where: { passengerId },
      order: { createdAt: 'DESC' },
    });
    if (mine.length === 0) {
      return [];
    }

    const tripIds = [...new Set(mine.map((entry) => entry.tripId))];
    const positions = await this.positionsOnTrips(tripIds);
    const trips = await this.tripsService.getDetailsMany(tripIds);

    return mine.map((entry) => {
      const trip = trips.get(entry.tripId);
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }
      return WaitlistEntryDto.fromEntity(
        entry,
        trip,
        positions.get(entry.id) ?? 1,
      );
    });
  }

  /**
   * Emails every waitlisted passenger in join order after a confirmed booking
   * frees a seat. Failures are logged and never roll back the cancellation.
   */
  async notifyOnSeatFreed(tripId: string): Promise<void> {
    try {
      const entries = await this.waitlistRepository.find({
        where: { tripId },
        order: { createdAt: 'ASC', id: 'ASC' },
      });
      for (let index = 0; index < entries.length; index += 1) {
        await this.notifications.notify({
          type: 'WAITLIST_SEAT_AVAILABLE',
          entry: entries[index],
          position: index + 1,
        });
      }
    } catch (error) {
      this.logger.error(
        `waitlist notify failed trip=${tripId}`,
        error as Error,
      );
    }
  }

  private async assertNoActiveBooking(
    tripId: string,
    passengerId: string,
  ): Promise<void> {
    const existing = await this.bookingsRepository.findOneBy({
      tripId,
      passengerId,
      status: In(ACTIVE_BOOKING_STATUSES),
    });
    if (existing) {
      throw new ConflictException(
        'You already have an active booking on this trip',
      );
    }
  }

  private async findTripOrFail(id: string): Promise<Trip> {
    const trip = await this.tripsRepository.findOneBy({ id });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip;
  }

  private async positionOf(entry: WaitlistEntry): Promise<number> {
    const positions = await this.positionsOnTrips([entry.tripId]);
    return positions.get(entry.id) ?? 1;
  }

  private async positionsOnTrips(
    tripIds: string[],
  ): Promise<Map<string, number>> {
    const siblings = await this.waitlistRepository.find({
      where: { tripId: In(tripIds) },
      order: { createdAt: 'ASC', id: 'ASC' },
      select: { id: true, tripId: true },
    });
    const counts = new Map<string, number>();
    const positions = new Map<string, number>();
    for (const sibling of siblings) {
      const next = (counts.get(sibling.tripId) ?? 0) + 1;
      counts.set(sibling.tripId, next);
      positions.set(sibling.id, next);
    }
    return positions;
  }

  private async toDto(
    entry: WaitlistEntry,
    position: number,
  ): Promise<WaitlistEntryDto> {
    const trips = await this.tripsService.getDetailsMany([entry.tripId]);
    const trip = trips.get(entry.tripId);
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return WaitlistEntryDto.fromEntity(entry, trip, position);
  }
}
