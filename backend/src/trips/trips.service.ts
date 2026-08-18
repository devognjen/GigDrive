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
import { BookingStatus, Currency, TripStatus } from '../common/enums';
import { Concert } from '../concerts/entities/concert.entity';
import { SignalAutomationService } from '../integrations/signal/signal-automation.service';
import {
  TRIP_NOTIFICATIONS,
  TripNotifications,
} from '../notifications/trip-notifications.port';
import { EMPTY_DRIVER_RATING } from '../reviews/driver-rating';
import { ReviewsService } from '../reviews/reviews.service';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { ListTripsDto } from './dto/list-trips.dto';
import { TripDto } from './dto/trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip } from './entities/trip.entity';
import { TripStop } from './entities/trip-stop.entity';
import {
  BROWSE_HIDDEN_STATUSES,
  compareTripsActiveFirst,
} from './trip-listing';
import {
  buildPassengerManifestCsv,
  manifestFilename,
} from './passenger-manifest';
import { PricingService } from './pricing.service';
import { TripStateMachine } from './trip-state-machine';

/**
 * Number of trips returned per list request. Kept deliberately small; the
 * frontend demands no pagination for the MVP browse view.
 */
const TRIPS_PAGE_SIZE = 50;

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(TripStop)
    private readonly stopsRepository: Repository<TripStop>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(Concert)
    private readonly concertsRepository: Repository<Concert>,
    private readonly pricing: PricingService,
    private readonly stateMachine: TripStateMachine,
    private readonly reviewsService: ReviewsService,
    @Inject(TRIP_NOTIFICATIONS)
    private readonly notifications: TripNotifications,
    private readonly signalAutomation: SignalAutomationService,
  ) {}

  /** Creates a trip for the given driver together with its pickup stops. */
  async create(driverId: string, dto: CreateTripDto): Promise<TripDto> {
    const vehicle = await this.findVehicleOrFail(dto.vehicleId);
    const concert = await this.findConcertOrFail(dto.concertId);

    this.assertOwnsVehicle(driverId, vehicle);
    this.assertValidCapacity(vehicle, dto.minPassengers, dto.maxPassengers);
    this.assertValidSchedule(
      dto.confirmationDeadline,
      dto.departureAt,
      concert,
    );

    const trip = this.tripsRepository.create({
      driverId,
      vehicleId: dto.vehicleId,
      concertId: dto.concertId,
      pricingMode: dto.pricingMode,
      totalCost: dto.totalCost,
      currency: dto.currency ?? Currency.Eur,
      minPassengers: dto.minPassengers,
      maxPassengers: dto.maxPassengers,
      confirmationDeadline: new Date(dto.confirmationDeadline),
      departureAt: new Date(dto.departureAt),
      roundTrip: dto.roundTrip ?? false,
      notes: dto.notes ?? null,
      status: TripStatus.Open,
    });
    const saved = await this.tripsRepository.save(trip);

    await this.replaceStops(saved.id, dto.stops);

    return this.getDetails(saved.id);
  }

  /**
   * Applies a partial update to a trip that is still OPEN. Callers must have
   * passed TripOwnershipGuard first; the service re-checks the editable state.
   */
  async update(id: string, dto: UpdateTripDto): Promise<TripDto> {
    const trip = await this.findTripOrFail(id);
    this.stateMachine.assertEditable(trip.status);

    const vehicle = dto.vehicleId
      ? await this.findVehicleOrFail(dto.vehicleId)
      : await this.findVehicleOrFail(trip.vehicleId);
    const concert = dto.concertId
      ? await this.findConcertOrFail(dto.concertId)
      : await this.findConcertOrFail(trip.concertId);

    if (dto.vehicleId && dto.vehicleId !== trip.vehicleId) {
      this.assertOwnsVehicle(trip.driverId, vehicle);
    }

    const minPassengers = dto.minPassengers ?? trip.minPassengers;
    const maxPassengers = dto.maxPassengers ?? trip.maxPassengers;
    this.assertValidCapacity(vehicle, minPassengers, maxPassengers);

    const deadline =
      dto.confirmationDeadline ?? trip.confirmationDeadline.toISOString();
    const departureAt = dto.departureAt ?? trip.departureAt.toISOString();
    this.assertValidSchedule(deadline, departureAt, concert);

    if (dto.vehicleId !== undefined) {
      trip.vehicleId = dto.vehicleId;
    }
    if (dto.concertId !== undefined) {
      trip.concertId = dto.concertId;
    }
    if (dto.pricingMode !== undefined) {
      trip.pricingMode = dto.pricingMode;
    }
    if (dto.totalCost !== undefined) {
      trip.totalCost = dto.totalCost;
    }
    if (dto.currency !== undefined) {
      trip.currency = dto.currency;
    }
    trip.minPassengers = minPassengers;
    trip.maxPassengers = maxPassengers;
    if (dto.confirmationDeadline !== undefined) {
      trip.confirmationDeadline = new Date(dto.confirmationDeadline);
    }
    if (dto.departureAt !== undefined) {
      trip.departureAt = new Date(dto.departureAt);
    }
    if (dto.roundTrip !== undefined) {
      trip.roundTrip = dto.roundTrip;
    }
    if (dto.notes !== undefined) {
      trip.notes = dto.notes;
    }

    await this.tripsRepository.save(trip);

    if (dto.stops !== undefined) {
      await this.replaceStops(id, dto.stops);
    }

    return this.getDetails(id);
  }

  /** Driver confirms a READY trip, advancing it to CONFIRMED. */
  async confirm(id: string): Promise<TripDto> {
    const trip = await this.findTripOrFail(id);
    const confirmedSeats = await this.countConfirmedSeats(id);
    this.stateMachine.assertConfirmable({
      status: trip.status,
      confirmedSeats,
      minPassengers: trip.minPassengers,
      maxPassengers: trip.maxPassengers,
      confirmationDeadline: trip.confirmationDeadline,
      departureAt: trip.departureAt,
    });

    trip.status = TripStatus.Confirmed;
    await this.tripsRepository.save(trip);
    await this.notifications.notify({ type: 'TRIP_CONFIRMED', trip });
    try {
      await this.signalAutomation.onTripConfirmed(trip);
    } catch (error) {
      this.logger.error(
        `Signal automation failed trip=${trip.id}`,
        error as Error,
      );
    }

    return this.getDetails(id);
  }

  /**
   * CSV passenger manifest of confirmed bookings for the trip driver.
   * Ownership is enforced by TripOwnershipGuard on the controller.
   */
  async exportManifest(
    tripId: string,
  ): Promise<{ csv: string; filename: string }> {
    const trip = await this.findTripOrFail(tripId);
    const bookings = await this.bookingsRepository.find({
      where: { tripId, status: BookingStatus.Confirmed },
      relations: { passenger: true },
      order: { createdAt: 'ASC' },
    });
    return {
      csv: buildPassengerManifestCsv(
        bookings.map((booking) => ({
          firstName: booking.passenger.firstName,
          lastName: booking.passenger.lastName,
          email: booking.passenger.email,
          phone: booking.passenger.phone,
          seats: booking.seats,
          paid: booking.paid,
          status: booking.status,
        })),
      ),
      filename: manifestFilename(
        trip.concert?.artist ?? '',
        trip.concert?.city ?? '',
        trip.concert?.startAt ?? trip.departureAt,
      ),
    };
  }

  /** Driver cancels a trip that is not already finished. */
  async cancel(id: string): Promise<TripDto> {
    const trip = await this.findTripOrFail(id);
    this.stateMachine.assertCancellable(trip.status);

    if (trip.status === TripStatus.Cancelled) {
      return this.getDetails(id);
    }

    trip.status = TripStatus.Cancelled;
    await this.tripsRepository.save(trip);
    await this.notifications.notify({ type: 'TRIP_CANCELLED', trip });

    return this.getDetails(id);
  }

  /**
   * Recomputes and persists the OPEN/READY/FULL status for a trip whenever the
   * booking set changes (accept, cancel). Terminal statuses are left untouched.
   * Emits a notification when the recomputation first reaches READY.
   */
  async recomputeStatus(tripId: string): Promise<void> {
    const trip = await this.findTripOrFail(tripId);
    const confirmedSeats = await this.countConfirmedSeats(tripId);
    const next = this.stateMachine.deriveStatus({
      status: trip.status,
      confirmedSeats,
      minPassengers: trip.minPassengers,
      maxPassengers: trip.maxPassengers,
      confirmationDeadline: trip.confirmationDeadline,
      departureAt: trip.departureAt,
    });

    if (next === trip.status) {
      return;
    }

    trip.status = next;
    await this.tripsRepository.save(trip);

    if (next === TripStatus.Ready) {
      await this.notifications.notify({ type: 'TRIP_READY', trip });
    }
  }

  /** Lists trips, filtered and sorted (FR-TRIP-03). */
  async list(dto: ListTripsDto): Promise<TripDto[]> {
    const trips = await this.loadTripsWithRelations(dto);
    return this.hydrateTrips(trips, dto);
  }

  /** Lists the trips organized by the given driver (GET /trips/mine). */
  async listMine(driverId: string): Promise<TripDto[]> {
    const trips = await this.tripsRepository.find({
      where: { driverId },
      relations: { vehicle: true, driver: true, concert: true, stops: true },
    });
    const result = await this.hydrateTrips(trips, {});
    return result.sort(compareTripsActiveFirst);
  }

  /** Loads a single trip with live price (FR-TRIP-04). */
  async getDetails(id: string): Promise<TripDto> {
    if (!id) {
      throw new NotFoundException('Trip not found');
    }
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: { vehicle: true, concert: true, stops: true, driver: true },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    const [dto] = await this.hydrateTrips([trip], {});
    return dto;
  }

  /**
   * Loads several trips (live price + concert summary) in one pass so booking
   * lists can hydrate without an N+1 of getDetails calls.
   */
  async getDetailsMany(ids: string[]): Promise<Map<string, TripDto>> {
    const uniqueIds = [...new Set(ids.filter((id) => Boolean(id)))];
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const trips = await this.tripsRepository.find({
      where: { id: In(uniqueIds) },
      relations: { vehicle: true, concert: true, stops: true, driver: true },
    });
    const dtos = await this.hydrateTrips(trips, {});
    return new Map(dtos.map((dto) => [dto.id, dto]));
  }

  /**
   * Scheduled-deadline sweep (FR-TRIP-06): cancels OPEN/FULL trips whose
   * go/no-go deadline has passed without the minimum being reached, and
   * completes CONFIRMED trips whose departure has passed.
   */
  async sweepExpired(): Promise<number> {
    const now = new Date();
    const active = await this.tripsRepository.find({
      where: {
        status: In([TripStatus.Open, TripStatus.Full, TripStatus.Ready]),
      },
    });

    let cancelled = 0;
    for (const trip of active) {
      if (trip.confirmationDeadline.getTime() > now.getTime()) {
        continue;
      }
      const confirmedSeats = await this.countConfirmedSeats(trip.id);
      if (confirmedSeats >= trip.minPassengers) {
        // Minimum reached before the deadline — leave it; the driver may still
        // confirm (READY) but it is not auto-confirmed.
        continue;
      }
      trip.status = TripStatus.Cancelled;
      await this.tripsRepository.save(trip);
      await this.notifications.notify({ type: 'TRIP_CANCELLED', trip });
      cancelled += 1;
    }

    const confirmedTrips = await this.tripsRepository.find({
      where: { status: TripStatus.Confirmed },
    });
    let completed = 0;
    for (const trip of confirmedTrips) {
      if (trip.departureAt.getTime() > now.getTime()) {
        continue;
      }
      trip.status = TripStatus.Completed;
      await this.tripsRepository.save(trip);
      await this.notifications.notify({ type: 'TRIP_COMPLETED', trip });
      completed += 1;
    }

    return cancelled + completed;
  }

  // ---- internals ----

  private async loadTripsWithRelations(dto: ListTripsDto): Promise<Trip[]> {
    const qb = this.tripsRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('trip.driver', 'driver')
      .leftJoinAndSelect('trip.concert', 'concert')
      .leftJoinAndSelect('trip.stops', 'stops')
      .andWhere('trip.status NOT IN (:...hidden)', {
        hidden: BROWSE_HIDDEN_STATUSES,
      })
      .orderBy('trip.departureAt', 'ASC')
      .take(TRIPS_PAGE_SIZE);

    if (dto.concertId) {
      qb.andWhere('trip.concertId = :concertId', { concertId: dto.concertId });
    }
    if (dto.vehicleType) {
      qb.andWhere('vehicle.type = :vehicleType', {
        vehicleType: dto.vehicleType,
      });
    }

    // Sort handled after hydration, since the live price is computed in JS.
    return qb.getMany();
  }

  /** Hydrates a list of trips into DTOs, applying price/seat/rating/from filters and sorting. */
  private async hydrateTrips(
    trips: Trip[],
    dto: ListTripsDto,
  ): Promise<TripDto[]> {
    const tripIds = trips.map((trip) => trip.id);
    const seatCounts = await this.countConfirmedSeatsFor(tripIds);
    const ratings = await this.reviewsService.aggregateByDriverIds(
      trips.map((trip) => trip.driverId),
    );

    const result: TripDto[] = [];
    for (const trip of trips) {
      const confirmedSeats = seatCounts.get(trip.id) ?? 0;
      const livePrice = this.pricing.calculate(
        trip.pricingMode,
        trip.totalCost,
        trip.minPassengers,
        trip.maxPassengers,
        confirmedSeats,
      );

      if (dto.maxPrice !== undefined && livePrice.perPerson > dto.maxPrice) {
        continue;
      }
      const seatsLeft = Math.max(trip.maxPassengers - confirmedSeats, 0);
      if (dto.seatsMin !== undefined && seatsLeft < dto.seatsMin) {
        continue;
      }
      if (dto.from && !this.matchesDeparture(trip, dto.from)) {
        continue;
      }

      const driverName = trip.driver
        ? `${trip.driver.firstName} ${trip.driver.lastName}`
        : 'Unknown driver';
      const driverRating = ratings.get(trip.driverId) ?? EMPTY_DRIVER_RATING;
      const driverAverageRating = driverRating.averageRating;

      if (dto.minRating !== undefined) {
        if (
          driverAverageRating === null ||
          driverAverageRating < dto.minRating
        ) {
          continue;
        }
      }

      result.push(
        TripDto.fromEntity(
          trip,
          confirmedSeats,
          livePrice,
          trip.stops ?? [],
          driverName,
          driverAverageRating,
          driverRating.reviewCount,
        ),
      );
    }

    if (dto.sort === 'cheapest') {
      result.sort((a, b) => a.livePrice.perPerson - b.livePrice.perPerson);
    } else if (dto.sort === 'likely') {
      // "Most likely to happen": highest confirmed-seat ratio first.
      result.sort((a, b) => {
        const ratioA = a.confirmedSeats / Math.max(a.maxPassengers, 1);
        const ratioB = b.confirmedSeats / Math.max(b.maxPassengers, 1);
        return ratioB - ratioA;
      });
    } else {
      result.sort(
        (a, b) => a.departureAt.getTime() - b.departureAt.getTime(),
      );
    }

    return result;
  }

  private matchesDeparture(trip: Trip, query: string): boolean {
    const sortedStops = (trip.stops ?? [])
      .slice()
      .sort((a, b) => a.seq - b.seq);
    const first = sortedStops[0];
    if (!first) {
      return false;
    }
    return first.place.toLowerCase().includes(query.toLowerCase());
  }

  private async replaceStops(
    tripId: string,
    stops: CreateTripDto['stops'],
  ): Promise<void> {
    await this.stopsRepository.delete({ tripId });
    const entities = stops.map((stop) =>
      this.stopsRepository.create({
        tripId,
        seq: stop.seq,
        place: stop.place,
        lat: stop.lat ?? null,
        lng: stop.lng ?? null,
        plannedTime: stop.plannedTime ? new Date(stop.plannedTime) : null,
      }),
    );
    await this.stopsRepository.save(entities);
  }

  private async countConfirmedSeats(tripId: string): Promise<number> {
    const rows = await this.bookingsRepository.find({
      where: { tripId, status: BookingStatus.Confirmed },
      select: { seats: true },
    });
    return rows.reduce((sum, booking) => sum + booking.seats, 0);
  }

  private async countConfirmedSeatsFor(
    tripIds: string[],
  ): Promise<Map<string, number>> {
    if (tripIds.length === 0) {
      return new Map();
    }
    const rows = await this.bookingsRepository.find({
      where: { tripId: In(tripIds), status: BookingStatus.Confirmed },
      select: { tripId: true, seats: true },
    });
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.tripId, (map.get(row.tripId) ?? 0) + row.seats);
    }
    return map;
  }

  private async findTripOrFail(id: string): Promise<Trip> {
    const trip = await this.tripsRepository.findOne({
      where: { id },
      relations: { vehicle: true, concert: true, stops: true, driver: true },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return trip;
  }

  private async findVehicleOrFail(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    return vehicle;
  }

  private async findConcertOrFail(id: string): Promise<Concert> {
    const concert = await this.concertsRepository.findOneBy({ id });
    if (!concert) {
      throw new NotFoundException('Concert not found');
    }
    return concert;
  }

  private assertOwnsVehicle(driverId: string, vehicle: Vehicle): void {
    if (vehicle.ownerId !== driverId) {
      throw new ConflictException('You can only use your own vehicle');
    }
  }

  private assertValidCapacity(
    vehicle: Vehicle,
    minPassengers: number,
    maxPassengers: number,
  ): void {
    if (minPassengers > maxPassengers) {
      throw new ConflictException(
        'Minimum passengers must not exceed maximum passengers',
      );
    }
    if (maxPassengers > vehicle.seats) {
      throw new ConflictException(
        `Maximum passengers must not exceed the vehicle's ${vehicle.seats} seats`,
      );
    }
  }

  /**
   * FR-TRIP-02 plus schedule sanity: deadline < departure ≤ concert start.
   * A go/no-go after people have already left (or after the show) is useless.
   */
  private assertValidSchedule(
    deadline: string,
    departureAt: string,
    concert: Concert,
  ): void {
    const deadlineMs = new Date(deadline).getTime();
    const departureMs = new Date(departureAt).getTime();
    const concertMs = concert.startAt.getTime();
    if (deadlineMs >= concertMs) {
      throw new ConflictException(
        'Confirmation deadline must be before the concert',
      );
    }
    if (deadlineMs >= departureMs) {
      throw new ConflictException(
        'Confirmation deadline must be before departure',
      );
    }
    if (departureMs > concertMs) {
      throw new ConflictException('Departure must be on or before the concert');
    }
  }
}
