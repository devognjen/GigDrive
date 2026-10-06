import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus, TripStatus } from '../common/enums';
import { Concert } from '../concerts/entities/concert.entity';
import { Review } from '../reviews/entities/review.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let usersRepository: { count: jest.Mock };
  let concertsRepository: { count: jest.Mock };
  let tripsRepository: { createQueryBuilder: jest.Mock };
  let bookingsRepository: { createQueryBuilder: jest.Mock };
  let reviewsRepository: { count: jest.Mock };

  beforeEach(async () => {
    usersRepository = { count: jest.fn().mockResolvedValue(5) };
    concertsRepository = { count: jest.fn() };
    concertsRepository.count
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    const tripQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ status: TripStatus.Open, count: '2' }]),
    };
    const bookingQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ status: BookingStatus.Confirmed, count: '4' }]),
    };
    tripsRepository = { createQueryBuilder: jest.fn().mockReturnValue(tripQb) };
    bookingsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(bookingQb),
    };
    reviewsRepository = { count: jest.fn().mockResolvedValue(2) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Concert), useValue: concertsRepository },
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
        { provide: getRepositoryToken(Review), useValue: reviewsRepository },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  it('aggregates platform KPIs', async () => {
    const stats = await service.getStats();

    expect(stats.users).toBe(5);
    expect(stats.concerts).toEqual({
      total: 6,
      cached: 5,
      userSubmitted: 1,
      hidden: 0,
    });
    expect(stats.tripsByStatus.OPEN).toBe(2);
    expect(stats.tripsByStatus.CANCELLED).toBe(0);
    expect(stats.bookingsByStatus.CONFIRMED).toBe(4);
    expect(stats.reviews).toBe(2);
  });
});
