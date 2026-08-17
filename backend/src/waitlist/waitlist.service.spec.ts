import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus, Currency, TripStatus } from '../common/enums';
import { WAITLIST_NOTIFICATIONS } from '../notifications/waitlist-notifications.port';
import { TripDto } from '../trips/dto/trip.dto';
import { Trip } from '../trips/entities/trip.entity';
import { TripsService } from '../trips/trips.service';
import { WaitlistEntry } from './entities/waitlist-entry.entity';
import { WaitlistService } from './waitlist.service';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let waitlistRepository: Record<string, jest.Mock>;
  let tripsRepository: Record<string, jest.Mock>;
  let bookingsRepository: Record<string, jest.Mock>;
  let tripsService: { getDetailsMany: jest.Mock };
  let notifications: { notify: jest.Mock };

  const tripId = 'trip-uuid';
  const passengerId = 'passenger-uuid';
  const driverId = 'driver-uuid';
  const entryId = 'entry-uuid';

  const buildTrip = (overrides: Partial<Trip> = {}): Trip =>
    ({
      id: tripId,
      driverId,
      maxPassengers: 8,
      minPassengers: 2,
      status: TripStatus.Full,
      ...overrides,
    }) as Trip;

  const buildTripDto = (): TripDto =>
    ({
      id: tripId,
      driverId,
      driverName: 'Demo Driver',
      driverAverageRating: null,
      driverReviewCount: 0,
      vehicleId: 'vehicle-uuid',
      vehicleType: 'VAN',
      concertId: 'concert-uuid',
      concertArtist: 'The Demo Band',
      concertTitle: 'Summer Open Air',
      concertCity: 'Novi Sad',
      pricingMode: 'SHARED_TOTAL',
      totalCost: 12000,
      currency: Currency.Eur,
      minPassengers: 4,
      maxPassengers: 8,
      confirmationDeadline: new Date(),
      departureAt: new Date(),
      roundTrip: false,
      notes: null,
      status: TripStatus.Full,
      confirmedSeats: 8,
      seatsLeft: 0,
      stops: [],
      livePrice: { perPerson: 1500, lowerBound: 1500, upperBound: 1500 },
    }) as TripDto;

  const buildEntry = (overrides: Partial<WaitlistEntry> = {}): WaitlistEntry =>
    ({
      id: entryId,
      tripId,
      passengerId,
      seats: 2,
      createdAt: new Date('2026-08-01T00:00:00Z'),
      ...overrides,
    }) as WaitlistEntry;

  beforeEach(async () => {
    waitlistRepository = {
      findOneBy: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data: Partial<WaitlistEntry>) => ({
        ...buildEntry(),
        ...data,
      })),
      save: jest.fn((entry: WaitlistEntry) => Promise.resolve(entry)),
      remove: jest.fn().mockResolvedValue(undefined),
    };
    tripsRepository = { findOneBy: jest.fn() };
    bookingsRepository = { findOneBy: jest.fn() };
    tripsService = {
      getDetailsMany: jest
        .fn()
        .mockResolvedValue(new Map([[tripId, buildTripDto()]])),
    };
    notifications = { notify: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        {
          provide: getRepositoryToken(WaitlistEntry),
          useValue: waitlistRepository,
        },
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
        { provide: TripsService, useValue: tripsService },
        { provide: WAITLIST_NOTIFICATIONS, useValue: notifications },
      ],
    }).compile();

    service = module.get(WaitlistService);
  });

  describe('join', () => {
    beforeEach(() => {
      tripsRepository.findOneBy.mockResolvedValue(buildTrip());
      waitlistRepository.findOneBy.mockResolvedValue(null);
      bookingsRepository.findOneBy.mockResolvedValue(null);
      waitlistRepository.find.mockResolvedValue([buildEntry()]);
    });

    it('joins a FULL trip and returns 1-based position', async () => {
      const result = await service.join(tripId, passengerId, { seats: 2 });

      expect(waitlistRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tripId, passengerId, seats: 2 }),
      );
      expect(result.position).toBe(1);
      expect(result.seats).toBe(2);
      expect(result.trip.concertArtist).toBe('The Demo Band');
      expect(result.trip.confirmedSeats).toBe(8);
    });

    it('does not change confirmed seat count when joining', async () => {
      const before = buildTripDto().confirmedSeats;
      await service.join(tripId, passengerId, { seats: 2 });
      expect(tripsService.getDetailsMany).toHaveBeenCalled();
      expect(before).toBe(8);
    });

    it('rejects join when the trip is not FULL', async () => {
      tripsRepository.findOneBy.mockResolvedValue(
        buildTrip({ status: TripStatus.Open }),
      );

      await expect(
        service.join(tripId, passengerId, { seats: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(waitlistRepository.save).not.toHaveBeenCalled();
    });

    it('rejects the driver joining their own trip', async () => {
      await expect(
        service.join(tripId, driverId, { seats: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(waitlistRepository.save).not.toHaveBeenCalled();
    });

    it('rejects a duplicate waitlist entry', async () => {
      waitlistRepository.findOneBy.mockResolvedValue(buildEntry());

      await expect(
        service.join(tripId, passengerId, { seats: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(waitlistRepository.save).not.toHaveBeenCalled();
    });

    it('rejects join when the passenger already has an active booking', async () => {
      bookingsRepository.findOneBy.mockResolvedValue({
        id: 'booking-uuid',
        status: BookingStatus.Pending,
      });

      await expect(
        service.join(tripId, passengerId, { seats: 1 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(waitlistRepository.save).not.toHaveBeenCalled();
    });

    it('rejects seats above trip capacity', async () => {
      await expect(
        service.join(tripId, passengerId, { seats: 9 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(waitlistRepository.save).not.toHaveBeenCalled();
    });

    it('throws when the trip does not exist', async () => {
      tripsRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.join(tripId, passengerId, { seats: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('leave', () => {
    it('removes the passenger entry even when the trip is no longer FULL', async () => {
      waitlistRepository.findOneBy.mockResolvedValue(buildEntry());

      await service.leave(tripId, passengerId);

      expect(waitlistRepository.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: entryId }),
      );
    });

    it('throws when the passenger is not on the waitlist', async () => {
      waitlistRepository.findOneBy.mockResolvedValue(null);
      await expect(service.leave(tripId, passengerId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('listMine', () => {
    it('returns entries with positions computed in join order', async () => {
      const first = buildEntry({
        id: 'first',
        createdAt: new Date('2026-08-01T00:00:00Z'),
      });
      const second = buildEntry({
        id: 'second',
        passengerId: 'other',
        createdAt: new Date('2026-08-02T00:00:00Z'),
      });
      waitlistRepository.find
        .mockResolvedValueOnce([first])
        .mockResolvedValueOnce([first, second]);

      const result = await service.listMine(passengerId);

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe(1);
    });

    it('returns an empty list when the passenger has no entries', async () => {
      waitlistRepository.find.mockResolvedValue([]);
      await expect(service.listMine(passengerId)).resolves.toEqual([]);
      expect(tripsService.getDetailsMany).not.toHaveBeenCalled();
    });
  });

  describe('notifyOnSeatFreed', () => {
    it('notifies waitlisted passengers in createdAt order', async () => {
      const first = buildEntry({
        id: 'first',
        createdAt: new Date('2026-08-01T00:00:00Z'),
      });
      const second = buildEntry({
        id: 'second',
        passengerId: 'other',
        createdAt: new Date('2026-08-02T00:00:00Z'),
      });
      waitlistRepository.find.mockResolvedValue([first, second]);

      await service.notifyOnSeatFreed(tripId);

      expect(notifications.notify).toHaveBeenNthCalledWith(1, {
        type: 'WAITLIST_SEAT_AVAILABLE',
        entry: first,
        position: 1,
      });
      expect(notifications.notify).toHaveBeenNthCalledWith(2, {
        type: 'WAITLIST_SEAT_AVAILABLE',
        entry: second,
        position: 2,
      });
    });

    it('does nothing when the waitlist is empty', async () => {
      waitlistRepository.find.mockResolvedValue([]);
      await service.notifyOnSeatFreed(tripId);
      expect(notifications.notify).not.toHaveBeenCalled();
    });
  });
});
