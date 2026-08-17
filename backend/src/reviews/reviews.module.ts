import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Concert } from '../concerts/entities/concert.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { Review } from './entities/review.entity';
import { ReviewEligibilityGuard } from './guards/review-eligibility.guard';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Booking, Trip, Concert, User])],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewEligibilityGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}
