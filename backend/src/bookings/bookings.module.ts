import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { Trip } from '../trips/entities/trip.entity';
import { TripsModule } from '../trips/trips.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { BookingDriverGuard } from './guards/booking-driver.guard';
import { BookingPassengerGuard } from './guards/booking-passenger.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Trip]),
    TripsModule,
    NotificationsModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingDriverGuard, BookingPassengerGuard],
})
export class BookingsModule {}
