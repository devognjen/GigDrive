import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../common/enums';
import { Concert } from '../concerts/entities/concert.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewDto } from './dto/review.dto';
import {
  DriverRating,
  EMPTY_DRIVER_RATING,
  roundToOneDecimal,
} from './driver-rating';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(Concert)
    private readonly concertsRepository: Repository<Concert>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Creates a review of the trip's driver. Callers must have passed
   * ReviewEligibilityGuard first; uniqueness is enforced here.
   */
  async create(
    tripId: string,
    authorId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    const existing = await this.reviewsRepository.findOneBy({
      tripId,
      authorId,
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this trip');
    }

    const review = this.reviewsRepository.create({
      tripId,
      authorId,
      rating: dto.rating,
      comment: dto.comment.trim(),
    });
    const saved = await this.reviewsRepository.save(review);
    return this.toDto(await this.findReviewOrFail(saved.id));
  }

  /** Lists reviews written about the given user as a driver (FR-REV-02). */
  async listForDriver(driverId: string): Promise<ReviewDto[]> {
    const driver = await this.usersRepository.findOneBy({ id: driverId });
    if (!driver) {
      throw new NotFoundException('User not found');
    }

    const reviews = await this.reviewsRepository.find({
      where: { trip: { driverId } },
      relations: { author: true },
      order: { createdAt: 'DESC' },
    });
    return reviews.map((review) =>
      ReviewDto.fromEntity(review, this.authorDisplayName(review)),
    );
  }

  /**
   * Batched average + count keyed by driver id. Drivers with no reviews are
   * omitted; callers should fall back to {@link EMPTY_DRIVER_RATING}.
   */
  async aggregateByDriverIds(
    driverIds: string[],
  ): Promise<Map<string, DriverRating>> {
    const uniqueIds = [...new Set(driverIds.filter((id) => Boolean(id)))];
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const rows = await this.reviewsRepository
      .createQueryBuilder('review')
      .innerJoin('review.trip', 'trip')
      .select('trip.driverId', 'driverId')
      .addSelect('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'count')
      .where('trip.driverId IN (:...driverIds)', { driverIds: uniqueIds })
      .groupBy('trip.driverId')
      .getRawMany<{ driverId: string; average: string; count: string }>();

    return new Map(
      rows.map((row) => {
        const reviewCount = Number(row.count);
        const rating: DriverRating = {
          averageRating:
            reviewCount === 0 ? null : roundToOneDecimal(Number(row.average)),
          reviewCount,
        };
        return [row.driverId, rating];
      }),
    );
  }

  async aggregateForDriver(driverId: string): Promise<DriverRating> {
    const ratings = await this.aggregateByDriverIds([driverId]);
    return ratings.get(driverId) ?? EMPTY_DRIVER_RATING;
  }

  /**
   * Trip ids the passenger may still review: confirmed booking, concert date
   * in the past, and no existing review. Used to populate BookingDto.canReview.
   */
  async reviewableTripIds(
    authorId: string,
    tripIds: string[],
  ): Promise<Set<string>> {
    const uniqueIds = [...new Set(tripIds.filter((id) => Boolean(id)))];
    if (uniqueIds.length === 0) {
      return new Set();
    }

    const confirmed = await this.bookingsRepository.find({
      where: {
        passengerId: authorId,
        tripId: In(uniqueIds),
        status: BookingStatus.Confirmed,
      },
      select: { tripId: true },
    });
    const confirmedIds = confirmed.map((booking) => booking.tripId);
    if (confirmedIds.length === 0) {
      return new Set();
    }

    const alreadyReviewed = await this.reviewsRepository.find({
      where: { authorId, tripId: In(confirmedIds) },
      select: { tripId: true },
    });
    const reviewed = new Set(alreadyReviewed.map((review) => review.tripId));
    const candidates = confirmedIds.filter((id) => !reviewed.has(id));
    if (candidates.length === 0) {
      return new Set();
    }

    const trips = await this.tripsRepository.find({
      where: { id: In(candidates) },
      select: { id: true, concertId: true },
    });
    const concertIds = [...new Set(trips.map((trip) => trip.concertId))];
    const concerts = await this.concertsRepository.find({
      where: { id: In(concertIds) },
      select: { id: true, startAt: true },
    });
    const pastConcertIds = new Set(
      concerts
        .filter((concert) => concert.startAt.getTime() < Date.now())
        .map((concert) => concert.id),
    );

    return new Set(
      trips
        .filter((trip) => pastConcertIds.has(trip.concertId))
        .map((trip) => trip.id),
    );
  }

  private async findReviewOrFail(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: { author: true },
    });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  private toDto(review: Review): ReviewDto {
    return ReviewDto.fromEntity(review, this.authorDisplayName(review));
  }

  private authorDisplayName(review: Review): string {
    if (!review.author) {
      return 'Unknown passenger';
    }
    return `${review.author.firstName} ${review.author.lastName}`;
  }
}
