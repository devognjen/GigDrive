import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Trip } from '../trips/entities/trip.entity';
import { TripsModule } from '../trips/trips.module';
import { WaitlistEntry } from './entities/waitlist-entry.entity';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WaitlistEntry, Trip, Booking]),
    TripsModule,
    NotificationsModule,
  ],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
