import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BookingStatus, TripStatus } from '../common/enums';
import {
  BOOKING_NOTIFICATIONS,
  BookingNotifications,
} from '../notifications/booking-notifications.port';
import { ReviewsService } from '../reviews/reviews.service';
import { Trip } from '../trips/entities/trip.entity';
import { TripsService } from '../trips/trips.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingDto } from './dto/booking.dto';
import { Booking } from './entities/booking.entity';

/**
 * Statuses for which a passenger still "holds" a seat reservation (i.e. an
 * active booking), used to prevent a passenger from double-booking a trip.
 */
const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.Pending,
  BookingStatus.Confirmed,
];

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    // Imported from TripsModule so that accept/cancel can recompute the trip's
    // OPEN/READY/FULL status and trigger the READY notification.
    private readonly tripsService: TripsService,
    private readonly reviewsService: ReviewsService,
    private readonly waitlistService: WaitlistService,
    @Inject(BOOKING_NOTIFICATIONS)
    private readonly notifications: BookingNotifications,
  ) {}

  /**
   * Passenger requests seats on a trip (FR-BOOK-01). Creates a PENDING booking
   * and emails the driver.
   */
  async request(
    tripId: string,
    passengerId: string,
    dto: CreateBookingDto,
  ): Promise<BookingDto> {
    const trip = await this.findTripOrFail(tripId);
    if (trip.driverId === passengerId) {
      throw new ConflictException('The driver cannot book their own trip');
    }
    if (!this.isBookable(trip.status)) {
      throw new ConflictException('This trip is no longer accepting bookings');
    }

    await this.assertNoActiveBooking(tripId, passengerId);

    const confirmedSeats = await this.countConfirmedSeats(tripId);
    if (confirmedSeats + dto.seats > trip.maxPassengers) {
      throw new ConflictException(
        'Not enough seats left for this trip (soft check)',
      );
    }

    const booking = this.bookingsRepository.create({
      tripId,
      passengerId,
      seats: dto.seats,
      status: BookingStatus.Pending,
      paid: false,
      decidedAt: null,
    });
    const saved = await this.bookingsRepository.save(booking);
    await this.notifications.notify({
      type: 'BOOKING_REQUESTED',
      booking: saved,
    });

    return this.toDto(await this.findBookingOrFail(saved.id));
  }

  /**
   * Driver accepts a booking (FR-BOOK-02). Re-checks capacity inside a DB
   * transaction with a pessimistic row lock on the trip so two concurrent
   * accepts can never overbook the last seat (§4.4).
   */
  async accept(id: string): Promise<BookingDto> {
    const booking = await this.findBookingOrFail(id);
    if (booking.status !== BookingStatus.Pending) {
      throw new ConflictException('Only PENDING bookings can be accepted');
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const trip = await manager.getRepository(Trip).findOne({
        where: { id: booking.tripId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }
      if (!this.isBookable(trip.status)) {
        throw new ConflictException(
          'This trip is no longer accepting bookings',
        );
      }

      const confirmedSeats = await manager
        .getRepository(Booking)
        .createQueryBuilder('booking')
        .where('booking.tripId = :tripId', { tripId: booking.tripId })
        .andWhere('booking.status = :status', {
          status: BookingStatus.Confirmed,
        })
        .select('COALESCE(SUM(booking.seats), 0)', 'total')
        .getRawOne<{ total: string }>();

      const occupied = Number(confirmedSeats?.total ?? '0');
      if (occupied + booking.seats > trip.maxPassengers) {
        throw new ConflictException(
          'Not enough seats left for this trip (capacity exceeded)',
        );
      }

      booking.status = BookingStatus.Confirmed;
      booking.decidedAt = new Date();
      return manager.getRepository(Booking).save(booking);
    });

    // Recomputation must run after the transaction commits so it reads the new
    // seat count. This also fires the TRIP_READY notification when the trip
    // first crosses the minimum threshold.
    await this.tripsService.recomputeStatus(saved.tripId);
    await this.notifications.notify({
      type: 'BOOKING_ACCEPTED',
      booking: saved,
    });

    return this.toDto(saved);
  }

  /**
   * Driver rejects a booking (FR-BOOK-02); the passenger is emailed.
   */
  async reject(id: string): Promise<BookingDto> {
    const booking = await this.findBookingOrFail(id);
    if (booking.status !== BookingStatus.Pending) {
      throw new ConflictException('Only PENDING bookings can be rejected');
    }

    booking.status = BookingStatus.Rejected;
    booking.decidedAt = new Date();
    const saved = await this.bookingsRepository.save(booking);
    await this.notifications.notify({
      type: 'BOOKING_REJECTED',
      booking: saved,
    });

    return this.toDto(saved);
  }

  /**
   * Passenger cancels their own booking (FR-BOOK-03). If it was CONFIRMED, the
   * seat frees up, the live price is recomputed, and a FULL trip reopens.
   */
  async cancel(id: string): Promise<BookingDto> {
    const booking = await this.findBookingOrFail(id);
    if (
      booking.status !== BookingStatus.Pending &&
      booking.status !== BookingStatus.Confirmed
    ) {
      throw new ConflictException('This booking can no longer be cancelled');
    }

    const wasConfirmed = booking.status === BookingStatus.Confirmed;
    booking.status = BookingStatus.CancelledByPassenger;
    booking.decidedAt = new Date();
    const saved = await this.bookingsRepository.save(booking);

    // Only a CONFIRMED cancellation affects capacity and therefore the trip.
    if (wasConfirmed) {
      await this.tripsService.recomputeStatus(saved.tripId);
      await this.waitlistService.notifyOnSeatFreed(saved.tripId);
    }

    return this.toDto(saved);
  }

  /**
   * Driver toggles the paid flag (FR-BOOK-04). Informational only.
   */
  async setPaid(id: string, paid: boolean): Promise<BookingDto> {
    const booking = await this.findBookingOrFail(id);
    if (booking.status !== BookingStatus.Confirmed) {
      throw new ConflictException('Only CONFIRMED bookings can be marked paid');
    }

    booking.paid = paid;
    const saved = await this.bookingsRepository.save(booking);
    return this.toDto(saved);
  }

  /** Lists the authenticated passenger's own bookings. */
  async listMine(passengerId: string): Promise<BookingDto[]> {
    const bookings = await this.bookingsRepository.find({
      where: { passengerId },
      relations: { passenger: true },
      order: { createdAt: 'DESC' },
    });
    return this.toDtos(bookings, { reviewerId: passengerId });
  }

  /** Lists all bookings for the authenticated user viewed as a driver. */
  async listForDriver(driverId: string): Promise<BookingDto[]> {
    const trips = await this.dataSource.getRepository(Trip).find({
      where: { driverId },
      select: { id: true },
    });
    const tripIds = trips.map((trip) => trip.id);
    if (tripIds.length === 0) {
      return [];
    }
    const bookings = await this.bookingsRepository.find({
      where: { tripId: In(tripIds) },
      relations: { passenger: true },
      order: { createdAt: 'DESC' },
    });
    return this.toDtos(bookings);
  }

  private isBookable(status: TripStatus): boolean {
    return (
      status === TripStatus.Open ||
      status === TripStatus.Full ||
      status === TripStatus.Ready
    );
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

  private async countConfirmedSeats(tripId: string): Promise<number> {
    const rows = await this.bookingsRepository.find({
      where: { tripId, status: BookingStatus.Confirmed },
      select: { seats: true },
    });
    return rows.reduce((sum, booking) => sum + booking.seats, 0);
  }

  private async findTripOrFail(id: string): Promise<Trip> {
    const trip = await this.dataSource.getRepository(Trip).findOneBy({ id });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip;
  }

  private async findBookingOrFail(id: string): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: { passenger: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  /** Hydrates a single booking with its live trip and passenger display name. */
  private async toDto(booking: Booking): Promise<BookingDto> {
    const [dto] = await this.toDtos([booking]);
    return dto;
  }

  /**
   * Batch-hydrates bookings: unique trip ids are resolved in one TripsService
   * call so list endpoints do not N+1 getDetails.
   */
  private async toDtos(
    bookings: Booking[],
    options: { reviewerId?: string } = {},
  ): Promise<BookingDto[]> {
    const tripIds = [...new Set(bookings.map((booking) => booking.tripId))];
    const trips = await this.tripsService.getDetailsMany(tripIds);
    const reviewable = options.reviewerId
      ? await this.reviewsService.reviewableTripIds(options.reviewerId, tripIds)
      : new Set<string>();
    return bookings.map((booking) => {
      const trip = trips.get(booking.tripId);
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }
      return BookingDto.fromEntity(
        booking,
        trip,
        this.passengerDisplayName(booking),
        reviewable.has(booking.tripId),
      );
    });
  }

  private passengerDisplayName(booking: Booking): string {
    if (!booking.passenger) {
      return 'Unknown passenger';
    }
    return `${booking.passenger.firstName} ${booking.passenger.lastName}`;
  }
}
