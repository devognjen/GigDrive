import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import {
  BookingStatus,
  Currency,
  PricingMode,
  TripStatus,
  VehicleType,
} from '../common/enums';
import { Concert } from '../concerts/entities/concert.entity';
import { TRIP_NOTIFICATIONS } from '../notifications/trip-notifications.port';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { Trip } from './entities/trip.entity';
import { TripStop } from './entities/trip-stop.entity';
import { PricingService } from './pricing.service';
import { TripStateMachine } from './trip-state-machine';
import { TripsService } from './trips.service';

describe('TripsService', () => {
  let service: TripsService;
  let tripsRepository: Record<string, jest.Mock>;
  let stopsRepository: Record<string, jest.Mock>;
  let bookingsRepository: Record<string, jest.Mock>;
  let vehiclesRepository: Record<string, jest.Mock>;
  let concertsRepository: Record<string, jest.Mock>;
  let notifications: { notify: jest.Mock };

  const tripId = 'trip-uuid';
  const vehicleId = 'vehicle-uuid';
  const concertId = 'concert-uuid';
  const driver = { id: 'driver-uuid', firstName: 'Demo', lastName: 'Driver' } as User;

  const future = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  const buildVehicle = (): Vehicle =>
    ({
      id: vehicleId,
      ownerId: driver.id,
      type: VehicleType.Van,
      make: 'Ford',
      model: 'Transit',
      seats: 8,
    }) as Vehicle;

  const buildConcert = (): Concert =>
    ({ id: concertId, startAt: future(45) }) as Concert;

  const buildTrip = (overrides: Partial<Trip> = {}): Trip =>
    ({
      id: tripId,
      driverId: driver.id,
      vehicleId,
      concertId,
      pricingMode: PricingMode.SharedTotal,
      totalCost: 12000,
      currency: Currency.Eur,
      minPassengers: 4,
      maxPassengers: 8,
      confirmationDeadline: future(30),
      departureAt: future(45),
      roundTrip: false,
      notes: null,
      status: TripStatus.Open,
      vehicle: buildVehicle(),
      concert: buildConcert(),
      driver,
      stops: [],
      ...overrides,
    }) as Trip;

  const createDto: CreateTripDto = {
    vehicleId,
    concertId,
    pricingMode: PricingMode.SharedTotal,
    totalCost: 12000,
    currency: Currency.Eur,
    minPassengers: 4,
    maxPassengers: 8,
    confirmationDeadline: future(30).toISOString(),
    departureAt: future(45).toISOString(),
    stops: [{ seq: 1, place: 'Novi Sad' }],
  };

  beforeEach(async () => {
    tripsRepository = {
      create: jest.fn((data) => ({ id: tripId, ...data })),
      save: jest.fn((trip) => Promise.resolve(trip)),
      find: jest.fn(),
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    stopsRepository = {
      delete: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((rows) => Promise.resolve(rows)),
    };
    bookingsRepository = { find: jest.fn().mockResolvedValue([]) };
    vehiclesRepository = { findOneBy: jest.fn() };
    concertsRepository = { findOneBy: jest.fn() };
    notifications = { notify: jest.fn() };

    tripsRepository.findOne.mockResolvedValue(buildTrip());
    vehiclesRepository.findOneBy.mockResolvedValue(buildVehicle());
    concertsRepository.findOneBy.mockResolvedValue(buildConcert());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        PricingService,
        TripStateMachine,
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
        { provide: getRepositoryToken(TripStop), useValue: stopsRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
        { provide: getRepositoryToken(Vehicle), useValue: vehiclesRepository },
        { provide: getRepositoryToken(Concert), useValue: concertsRepository },
        { provide: TRIP_NOTIFICATIONS, useValue: notifications },
      ],
    }).compile();

    service = module.get(TripsService);
  });

  describe('create', () => {
    it('persists the trip for the driver with OPEN status', async () => {
      bookingsRepository.find.mockResolvedValue([]);
      const result = await service.create(driver.id, createDto);

      expect(tripsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ driverId: driver.id, status: TripStatus.Open }),
      );
      expect(stopsRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject({ id: tripId, driverId: driver.id });
    });

    it('rejects a foreign vehicle', async () => {
      vehiclesRepository.findOneBy.mockResolvedValue({
        ...buildVehicle(),
        ownerId: 'other-driver',
      });
      await expect(service.create(driver.id, createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tripsRepository.save).not.toHaveBeenCalled();
    });

    it('rejects min > max', async () => {
      await expect(
        service.create(driver.id, { ...createDto, minPassengers: 6, maxPassengers: 4 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects max > vehicle seats', async () => {
      await expect(
        service.create(driver.id, { ...createDto, maxPassengers: 99 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a deadline after the concert', async () => {
      concertsRepository.findOneBy.mockResolvedValue({
        ...buildConcert(),
        startAt: future(5),
      });
      await expect(service.create(driver.id, createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('confirm', () => {
    it('confirms a READY trip and notifies', async () => {
      tripsRepository.findOne.mockResolvedValue(
        buildTrip({ status: TripStatus.Ready }),
      );
      bookingsRepository.find.mockResolvedValue([
        { seats: 4 },
        { seats: 2 },
      ]);

      const result = await service.confirm(tripId);

      expect(tripsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripStatus.Confirmed }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRIP_CONFIRMED' }),
      );
      expect(result.status).toBe(TripStatus.Confirmed);
    });

    it('rejects confirming a non-READY trip', async () => {
      tripsRepository.findOne.mockResolvedValue(buildTrip({ status: TripStatus.Open }));
      bookingsRepository.find.mockResolvedValue([{ seats: 4 }]);

      await expect(service.confirm(tripId)).rejects.toBeInstanceOf(ConflictException);
      expect(notifications.notify).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('cancels and notifies', async () => {
      const result = await service.cancel(tripId);
      expect(tripsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripStatus.Cancelled }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRIP_CANCELLED' }),
      );
      expect(result.status).toBe(TripStatus.Cancelled);
    });

    it('rejects cancelling a completed trip', async () => {
      tripsRepository.findOne.mockResolvedValue(
        buildTrip({ status: TripStatus.Completed }),
      );
      await expect(service.cancel(tripId)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('updates only while OPEN', async () => {
      await service.update(tripId, { notes: 'new note' });
      expect(tripsRepository.save).toHaveBeenCalled();
    });

    it('rejects editing a non-OPEN trip', async () => {
      tripsRepository.findOne.mockResolvedValue(
        buildTrip({ status: TripStatus.Ready }),
      );
      await expect(service.update(tripId, { notes: 'x' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('recomputeStatus', () => {
    it('moves OPEN → READY when the minimum is met and notifies', async () => {
      tripsRepository.findOne.mockResolvedValue(buildTrip());
      bookingsRepository.find.mockResolvedValue([{ seats: 4 }]);

      await service.recomputeStatus(tripId);

      expect(tripsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripStatus.Ready }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRIP_READY' }),
      );
    });

    it('moves OPEN → FULL when every seat is filled', async () => {
      tripsRepository.findOne.mockResolvedValue(buildTrip());
      bookingsRepository.find.mockResolvedValue([{ seats: 8 }]);

      await service.recomputeStatus(tripId);

      expect(tripsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripStatus.Full }),
      );
    });

    it('reopens FULL → OPEN when bookings drop below the minimum', async () => {
      tripsRepository.findOne.mockResolvedValue(
        buildTrip({ status: TripStatus.Full }),
      );
      bookingsRepository.find.mockResolvedValue([{ seats: 3 }]);

      await service.recomputeStatus(tripId);

      expect(tripsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripStatus.Open }),
      );
    });

    it('does nothing when the status is unchanged', async () => {
      tripsRepository.findOne.mockResolvedValue(buildTrip());
      bookingsRepository.find.mockResolvedValue([{ seats: 2 }]);

      await service.recomputeStatus(tripId);

      expect(tripsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('sweepExpired', () => {
    it('cancels an under-subscribed trip past its deadline', async () => {
      const pastDeadline = new Date();
      pastDeadline.setDate(pastDeadline.getDate() - 1);
      tripsRepository.find
        .mockResolvedValueOnce([buildTrip({ confirmationDeadline: pastDeadline })])
        .mockResolvedValueOnce([]);
      bookingsRepository.find.mockResolvedValue([{ seats: 2 }]);

      const changed = await service.sweepExpired();

      expect(changed).toBe(1);
      expect(tripsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripStatus.Cancelled }),
      );
    });

    it('completes a CONFIRMED trip past departure', async () => {
      const pastDeparture = new Date();
      pastDeparture.setDate(pastDeparture.getDate() - 1);
      tripsRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          buildTrip({ status: TripStatus.Confirmed, departureAt: pastDeparture }),
        ]);
      bookingsRepository.find.mockResolvedValue([]);
      notifications.notify.mockClear();

      const changed = await service.sweepExpired();

      expect(changed).toBe(1);
      expect(tripsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripStatus.Completed }),
      );
    });
  });

  describe('getDetails', () => {
    it('throws NotFound for an unknown trip', async () => {
      tripsRepository.findOne.mockResolvedValue(null);
      await expect(service.getDetails('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
