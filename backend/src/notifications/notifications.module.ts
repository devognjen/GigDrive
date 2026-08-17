import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTransport, type Transporter } from 'nodemailer';
import { Booking } from '../bookings/entities/booking.entity';
import { Concert } from '../concerts/entities/concert.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { BOOKING_NOTIFICATIONS } from './booking-notifications.port';
import { EmailBookingNotifications } from './email-booking-notifications';
import { EmailTripNotifications } from './email-trip-notifications';
import { MAIL_TRANSPORT } from './mail.transport';
import { MailerService } from './mailer.service';
import { TRIP_NOTIFICATIONS } from './trip-notifications.port';
import { TripReminderJob } from './trip-reminder.job';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Trip, Booking, Concert, User]),
  ],
  providers: [
    {
      provide: MAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Transporter | null => {
        const user = config.get<string>('smtp.user') ?? '';
        const pass = config.get<string>('smtp.pass') ?? '';
        if (!user || !pass) {
          return null;
        }
        return createTransport({
          host: config.get<string>('smtp.host'),
          port: config.get<number>('smtp.port'),
          auth: { user, pass },
        });
      },
    },
    MailerService,
    EmailTripNotifications,
    EmailBookingNotifications,
    { provide: TRIP_NOTIFICATIONS, useExisting: EmailTripNotifications },
    {
      provide: BOOKING_NOTIFICATIONS,
      useExisting: EmailBookingNotifications,
    },
    TripReminderJob,
  ],
  exports: [TRIP_NOTIFICATIONS, BOOKING_NOTIFICATIONS],
})
export class NotificationsModule {}
