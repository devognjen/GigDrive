import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Concert } from '../concerts/entities/concert.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewsRepository: Record<string, jest.Mock>;
  let bookingsRepository: Record<string, jest.Mock>;
  let tripsRepository: Record<string, jest.Mock>;
  let concertsRepository: Record<string, jest.Mock>;
  let usersRepository: Record<string, jest.Mock>;
  let queryBuilder: Record<string, jest.Mock>;

  const tripId = 'trip-uuid';
  const authorId = 'author-uuid';
  const driverId = 'driver-uuid';
  const concertId = 'concert-uuid';

  const author = {
    id: authorId,
    firstName: 'Ana',
    lastName: 'Passenger',
  } as User;

  const buildReview = (overrides: Partial<Review> = {}): Review =>
    ({
      id: 'review-uuid',
      tripId,
      authorId,
      author,
      rating: 5,
      comment: 'Great ride',
      createdAt: new Date('2026-08-01T00:00:00Z'),
      ...overrides,
    }) as Review;

  beforeEach(async () => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };
    reviewsRepository = {
      findOneBy: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data: Partial<Review>) => ({
        ...buildReview(),
        ...data,
      })),
      save: jest.fn((review: Review) => Promise.resolve(review)),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    bookingsRepository = { find: jest.fn() };
    tripsRepository = { find: jest.fn() };
    concertsRepository = { find: jest.fn() };
    usersRepository = { findOneBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: reviewsRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
        { provide: getRepositoryToken(Concert), useValue: concertsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get(ReviewsService);
  });

  describe('create', () => {
    it('persists a review and returns the public shape', async () => {
      reviewsRepository.findOneBy.mockResolvedValue(null);
      reviewsRepository.findOne.mockResolvedValue(buildReview());

      const result = await service.create(tripId, authorId, {
        rating: 5,
        comment: '  Great ride  ',
      });

      expect(reviewsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tripId,
          authorId,
          rating: 5,
          comment: 'Great ride',
        }),
      );
      expect(result).toMatchObject({
        tripId,
        authorId,
        authorName: 'Ana Passenger',
        rating: 5,
        comment: 'Great ride',
      });
    });

    it('rejects a second review of the same trip', async () => {
      reviewsRepository.findOneBy.mockResolvedValue(buildReview());

      await expect(
        service.create(tripId, authorId, { rating: 4, comment: 'Again' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(reviewsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('listForDriver', () => {
    it('returns reviews of the driver newest first', async () => {
      usersRepository.findOneBy.mockResolvedValue({ id: driverId });
      reviewsRepository.find.mockResolvedValue([buildReview()]);

      const result = await service.listForDriver(driverId);

      expect(reviewsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { trip: { driverId } },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].authorName).toBe('Ana Passenger');
    });

    it('throws NotFoundException for an unknown user', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);
      await expect(service.listForDriver('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('aggregateByDriverIds', () => {
    it('returns an empty map when no ids are given', async () => {
      await expect(service.aggregateByDriverIds([])).resolves.toEqual(
        new Map(),
      );
      expect(reviewsRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('rounds the average to one decimal and keys by driver', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        { driverId, average: '4.666666666', count: '3' },
      ]);

      const result = await service.aggregateByDriverIds([driverId]);

      expect(result.get(driverId)).toEqual({
        averageRating: 4.7,
        reviewCount: 3,
      });
    });
  });

  describe('aggregateForDriver', () => {
    it('returns the empty rating when the driver has no reviews', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);
      await expect(service.aggregateForDriver(driverId)).resolves.toEqual({
        averageRating: null,
        reviewCount: 0,
      });
    });
  });

  describe('reviewableTripIds', () => {
    it('includes a confirmed booking on a past concert that is not yet reviewed', async () => {
      bookingsRepository.find.mockResolvedValue([{ tripId }]);
      reviewsRepository.find.mockResolvedValue([]);
      tripsRepository.find.mockResolvedValue([{ id: tripId, concertId }]);
      concertsRepository.find.mockResolvedValue([
        { id: concertId, startAt: new Date('2020-01-01T00:00:00Z') },
      ]);

      await expect(
        service.reviewableTripIds(authorId, [tripId]),
      ).resolves.toEqual(new Set([tripId]));
    });

    it('excludes trips that were already reviewed', async () => {
      bookingsRepository.find.mockResolvedValue([{ tripId }]);
      reviewsRepository.find.mockResolvedValue([{ tripId }]);

      await expect(
        service.reviewableTripIds(authorId, [tripId]),
      ).resolves.toEqual(new Set());
      expect(tripsRepository.find).not.toHaveBeenCalled();
    });

    it('excludes trips whose concert has not yet started', async () => {
      bookingsRepository.find.mockResolvedValue([{ tripId }]);
      reviewsRepository.find.mockResolvedValue([]);
      tripsRepository.find.mockResolvedValue([{ id: tripId, concertId }]);
      concertsRepository.find.mockResolvedValue([
        { id: concertId, startAt: new Date(Date.now() + 86_400_000) },
      ]);

      await expect(
        service.reviewableTripIds(authorId, [tripId]),
      ).resolves.toEqual(new Set());
    });
  });
});
