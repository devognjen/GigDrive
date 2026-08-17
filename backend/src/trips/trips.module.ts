import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Concert } from '../concerts/entities/concert.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { Trip } from './entities/trip.entity';
import { TripStop } from './entities/trip-stop.entity';
import { TripOwnershipGuard } from './guards/trip-ownership.guard';
import { PricingService } from './pricing.service';
import { TripSweepJob } from './trip-sweep.job';
import { TripStateMachine } from './trip-state-machine';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripStop, Booking, Vehicle, Concert]),
    NotificationsModule,
    ReviewsModule,
  ],
  controllers: [TripsController],
  providers: [
    TripsService,
    PricingService,
    TripStateMachine,
    TripOwnershipGuard,
    TripSweepJob,
  ],
  exports: [TripsService],
})
export class TripsModule {}
