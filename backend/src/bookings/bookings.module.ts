import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingBookingNotifications } from '../notifications/logging-booking-notifications';
import { BOOKING_NOTIFICATIONS } from '../notifications/booking-notifications.port';
import { Trip } from '../trips/entities/trip.entity';
import { TripsModule } from '../trips/trips.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { BookingDriverGuard } from './guards/booking-driver.guard';
import { BookingPassengerGuard } from './guards/booking-passenger.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Trip]), TripsModule],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    BookingDriverGuard,
    BookingPassengerGuard,
    // Placeholder notification transport (feature 07 replaces this provider
    // with the real Mailtrap/Nodemailer implementation).
    { provide: BOOKING_NOTIFICATIONS, useClass: LoggingBookingNotifications },
  ],
})
export class BookingsModule {}
