import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Concert } from '../concerts/entities/concert.entity';
import { Review } from '../reviews/entities/review.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import {
  ALL_BOOKING_STATUSES,
  ALL_TRIP_STATUSES,
  tallyByStatus,
} from './admin-stats';
import { AdminStatsDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Concert)
    private readonly concertsRepository: Repository<Concert>,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
  ) {}

  async getStats(): Promise<AdminStatsDto> {
    const [
      users,
      concertsTotal,
      concertsCached,
      concertsUserSubmitted,
      concertsHidden,
      tripRows,
      bookingRows,
      reviews,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.concertsRepository.count(),
      this.concertsRepository.count({ where: { userSubmitted: false } }),
      this.concertsRepository.count({ where: { userSubmitted: true } }),
      this.concertsRepository.count({ where: { hidden: true } }),
      this.tripsRepository
        .createQueryBuilder('trip')
        .select('trip.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('trip.status')
        .getRawMany<{ status: string; count: string }>(),
      this.bookingsRepository
        .createQueryBuilder('booking')
        .select('booking.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('booking.status')
        .getRawMany<{ status: string; count: string }>(),
      this.reviewsRepository.count(),
    ]);

    return AdminStatsDto.from({
      users,
      concerts: {
        total: concertsTotal,
        cached: concertsCached,
        userSubmitted: concertsUserSubmitted,
        hidden: concertsHidden,
      },
      tripsByStatus: tallyByStatus(tripRows, ALL_TRIP_STATUSES),
      bookingsByStatus: tallyByStatus(bookingRows, ALL_BOOKING_STATUSES),
      reviews,
    });
  }
}
