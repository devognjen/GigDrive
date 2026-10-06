import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { ConcertsModule } from '../concerts/concerts.module';
import { Concert } from '../concerts/entities/concert.entity';
import { Review } from '../reviews/entities/review.entity';
import { Trip } from '../trips/entities/trip.entity';
import { TripsModule } from '../trips/trips.module';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Concert, Trip, Booking, Review]),
    UsersModule,
    ConcertsModule,
    TripsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
