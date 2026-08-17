import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BookingStatus, Currency, TripStatus } from '../common/enums';
import { BOOKING_NOTIFICATIONS } from '../notifications/booking-notifications.port';
import { ReviewsService } from '../reviews/reviews.service';
import { TripDto } from '../trips/dto/trip.dto';
import { Trip } from '../trips/entities/trip.entity';
import { TripsService } from '../trips/trips.service';
import { User } from '../users/entities/user.entity';
import { WaitlistService } from '../waitlist/waitlist.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingsRepository: Record<string, jest.Mock>;
  let tripRepository: Record<string, jest.Mock>;
  let dataSource: { transaction: jest.Mock; getRepository: jest.Mock };
  let tripsService: {
    recomputeStatus: jest.Mock;
    getDetailsMany: jest.Mock;
  };
  let reviewsService: {
    reviewableTripIds: jest.Mock;
  };
  let waitlistService: {
    notifyOnSeatFreed: jest.Mock;
  };
  let notifications: { notify: jest.Mock };

  const tripId = 'trip-uuid';
  const passengerId = 'passenger-uuid';
  const driverId = 'driver-uuid';
  const bookingId = 'booking-uuid';

  const passenger = {
    id: passengerId,
    firstName: 'Pat',
    lastName: 'Passenger',
  } as User;

  const buildTrip = (overrides: Partial<Trip> = {}): Trip =>
    ({
      id: tripId,
      driverId,
      maxPassengers: 8,
      minPassengers: 2,
      status: TripStatus.Open,
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
      status: TripStatus.Open,
      confirmedSeats: 0,
      seatsLeft: 8,
      stops: [],
      livePrice: { perPerson: 3000, lowerBound: 3000, upperBound: 1500 },
    }) as TripDto;

  const buildBooking = (overrides: Partial<Booking> = {}): Booking =>
    ({
      id: bookingId,
      tripId,
      passengerId,
      passenger,
      seats: 2,
      status: BookingStatus.Pending,
      paid: false,
      createdAt: new Date(),
      decidedAt: null,
      ...overrides,
    }) as Booking;

  const createDto: CreateBookingDto = { seats: 2 };

  beforeEach(async () => {
    bookingsRepository = {
      create: jest.fn((data: Partial<Booking>) => ({
        ...buildBooking(),
        ...data,
      })),
      save: jest.fn((booking: Booking) => Promise.resolve(booking)),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };
    tripRepository = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(),
      getRepository: jest.fn(),
    };
    tripsService = {
      recomputeStatus: jest.fn().mockResolvedValue(undefined),
      getDetailsMany: jest
        .fn()
        .mockResolvedValue(new Map([[tripId, buildTripDto()]])),
    };
    reviewsService = {
      reviewableTripIds: jest.fn().mockResolvedValue(new Set()),
    };
    waitlistService = {
      notifyOnSeatFreed: jest.fn().mockResolvedValue(undefined),
    };
    notifications = { notify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
        { provide: DataSource, useValue: dataSource },
        { provide: TripsService, useValue: tripsService },
        { provide: ReviewsService, useValue: reviewsService },
        { provide: WaitlistService, useValue: waitlistService },
        { provide: BOOKING_NOTIFICATIONS, useValue: notifications },
      ],
    }).compile();

    service = module.get(BookingsService);
  });

  describe('request', () => {
    it('creates a PENDING booking and notifies the driver', async () => {
      dataSource.getRepository.mockReturnValue(tripRepository);
      tripRepository.findOneBy.mockResolvedValue(buildTrip());
      bookingsRepository.find.mockResolvedValue([]);
      bookingsRepository.findOneBy.mockResolvedValue(null);
      bookingsRepository.findOne.mockResolvedValue(buildBooking());

      const result = await service.request(tripId, passengerId, createDto);

      expect(bookingsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.Pending, tripId }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'BOOKING_REQUESTED' }),
      );
      expect(result.status).toBe(BookingStatus.Pending);
      expect(result.passengerName).toBe('Pat Passenger');
      expect(result.trip.concertArtist).toBe('The Demo Band');
    });

    it('rejects the driver booking their own trip', async () => {
      dataSource.getRepository.mockReturnValue(tripRepository);
      tripRepository.findOneBy.mockResolvedValue(buildTrip());

      await expect(
        service.request(tripId, driverId, createDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects booking a committed trip', async () => {
      dataSource.getRepository.mockReturnValue(tripRepository);
      tripRepository.findOneBy.mockResolvedValue(
        buildTrip({ status: TripStatus.Confirmed }),
      );

      await expect(
        service.request(tripId, passengerId, createDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a duplicate active booking', async () => {
      dataSource.getRepository.mockReturnValue(tripRepository);
      tripRepository.findOneBy.mockResolvedValue(buildTrip());
      bookingsRepository.findOneBy.mockResolvedValue(buildBooking());

      await expect(
        service.request(tripId, passengerId, createDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects over-capacity at request time (soft check)', async () => {
      dataSource.getRepository.mockReturnValue(tripRepository);
      tripRepository.findOneBy.mockResolvedValue(buildTrip());
      bookingsRepository.findOneBy.mockResolvedValue(null);
      bookingsRepository.find.mockResolvedValue([{ seats: 7 }]);

      await expect(
        service.request(tripId, passengerId, createDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFound for an unknown trip', async () => {
      dataSource.getRepository.mockReturnValue(tripRepository);
      tripRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.request('missing', passengerId, createDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('accept', () => {
    it('confirms a PENDING booking inside a transaction and notifies', async () => {
      bookingsRepository.findOne.mockResolvedValue(buildBooking());

      const manager = {
        getRepository: (entity: unknown) => {
          if (entity === Trip) {
            return { findOne: jest.fn().mockResolvedValue(buildTrip()) };
          }
          if (entity === Booking) {
            return {
              createQueryBuilder: () => ({
                where: () => ({
                  andWhere: () => ({
                    select: () => ({
                      getRawOne: jest.fn().mockResolvedValue({ total: '0' }),
                    }),
                  }),
                }),
              }),
              save: jest.fn((b: Booking) => Promise.resolve(b)),
            };
          }
          return {};
        },
      };
      dataSource.transaction.mockImplementation(
        async (cb: (m: unknown) => Promise<Booking>) => cb(manager),
      );

      const result = await service.accept(bookingId);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(tripsService.recomputeStatus).toHaveBeenCalledWith(tripId);
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'BOOKING_ACCEPTED' }),
      );
      expect(result.status).toBe(BookingStatus.Confirmed);
    });

    it('rejects accepting a non-PENDING booking', async () => {
      bookingsRepository.findOne.mockResolvedValue(
        buildBooking({ status: BookingStatus.Confirmed }),
      );

      await expect(service.accept(bookingId)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('rejects over-capacity inside the transaction', async () => {
      bookingsRepository.findOne.mockResolvedValue(buildBooking());

      const manager = {
        getRepository: (entity: unknown) => {
          if (entity === Trip) {
            return { findOne: jest.fn().mockResolvedValue(buildTrip()) };
          }
          if (entity === Booking) {
            return {
              createQueryBuilder: () => ({
                where: () => ({
                  andWhere: () => ({
                    select: () => ({
                      getRawOne: jest.fn().mockResolvedValue({ total: '8' }),
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        },
      };
      dataSource.transaction.mockImplementation(
        async (cb: (m: unknown) => Promise<Booking>) => cb(manager),
      );

      await expect(service.accept(bookingId)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tripsService.recomputeStatus).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('rejects a PENDING booking and notifies', async () => {
      bookingsRepository.findOne.mockResolvedValue(buildBooking());

      const result = await service.reject(bookingId);

      expect(bookingsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.Rejected }),
      );
      expect(notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'BOOKING_REJECTED' }),
      );
      expect(result.status).toBe(BookingStatus.Rejected);
    });

    it('rejects rejecting a non-PENDING booking', async () => {
      bookingsRepository.findOne.mockResolvedValue(
        buildBooking({ status: BookingStatus.Rejected }),
      );

      await expect(service.reject(bookingId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('cancel', () => {
    it('cancels a CONFIRMED booking and recomputes the trip', async () => {
      bookingsRepository.findOne.mockResolvedValue(
        buildBooking({ status: BookingStatus.Confirmed }),
      );

      const result = await service.cancel(bookingId);

      expect(bookingsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: BookingStatus.CancelledByPassenger }),
      );
      expect(tripsService.recomputeStatus).toHaveBeenCalledWith(tripId);
      expect(waitlistService.notifyOnSeatFreed).toHaveBeenCalledWith(tripId);
      expect(result.status).toBe(BookingStatus.CancelledByPassenger);
    });

    it('cancels a PENDING booking without recomputing', async () => {
      bookingsRepository.findOne.mockResolvedValue(buildBooking());

      await service.cancel(bookingId);

      expect(tripsService.recomputeStatus).not.toHaveBeenCalled();
      expect(waitlistService.notifyOnSeatFreed).not.toHaveBeenCalled();
    });

    it('rejects cancelling a rejected booking', async () => {
      bookingsRepository.findOne.mockResolvedValue(
        buildBooking({ status: BookingStatus.Rejected }),
      );

      await expect(service.cancel(bookingId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('setPaid', () => {
    it('sets the paid flag on a CONFIRMED booking', async () => {
      bookingsRepository.findOne.mockResolvedValue(
        buildBooking({ status: BookingStatus.Confirmed }),
      );

      const result = await service.setPaid(bookingId, true);

      expect(bookingsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ paid: true }),
      );
      expect(result.paid).toBe(true);
    });

    it('rejects marking a non-CONFIRMED booking paid', async () => {
      bookingsRepository.findOne.mockResolvedValue(buildBooking());

      await expect(service.setPaid(bookingId, true)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('listMine', () => {
    it('maps bookings to DTOs with trip and passenger name', async () => {
      bookingsRepository.find.mockResolvedValue([buildBooking()]);
      const result = await service.listMine(passengerId);
      expect(result[0].id).toBe(bookingId);
      expect(result[0].passengerName).toBe('Pat Passenger');
      expect(result[0].trip.livePrice.perPerson).toBe(3000);
      expect(result[0].canReview).toBe(false);
      expect(tripsService.getDetailsMany).toHaveBeenCalledWith([tripId]);
      expect(reviewsService.reviewableTripIds).toHaveBeenCalledWith(
        passengerId,
        [tripId],
      );
    });

    it('sets canReview when the trip is still reviewable', async () => {
      bookingsRepository.find.mockResolvedValue([
        buildBooking({ status: BookingStatus.Confirmed }),
      ]);
      reviewsService.reviewableTripIds.mockResolvedValue(new Set([tripId]));
      const result = await service.listMine(passengerId);
      expect(result[0].canReview).toBe(true);
    });
  });

  describe('listForDriver', () => {
    it('returns empty when the driver has no trips', async () => {
      dataSource.getRepository.mockReturnValue(tripRepository);
      tripRepository.find.mockResolvedValue([]);
      const result = await service.listForDriver(driverId);
      expect(result).toEqual([]);
      expect(tripsService.getDetailsMany).not.toHaveBeenCalled();
    });

    it('maps the driver trips bookings with nested trip', async () => {
      dataSource.getRepository.mockReturnValue(tripRepository);
      tripRepository.find.mockResolvedValue([buildTrip()]);
      bookingsRepository.find.mockResolvedValue([buildBooking()]);
      const result = await service.listForDriver(driverId);
      expect(result[0].id).toBe(bookingId);
      expect(result[0].trip.concertTitle).toBe('Summer Open Air');
      expect(result[0].canReview).toBe(false);
      expect(reviewsService.reviewableTripIds).not.toHaveBeenCalled();
    });
  });
});
