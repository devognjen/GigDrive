import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { type Transporter } from 'nodemailer';
import { createMailTransport } from './create-mail-transport';
import { Booking } from '../bookings/entities/booking.entity';
import { Concert } from '../concerts/entities/concert.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { WaitlistEntry } from '../waitlist/entities/waitlist-entry.entity';
import { BOOKING_NOTIFICATIONS } from './booking-notifications.port';
import { EmailBookingNotifications } from './email-booking-notifications';
import { EmailTripNotifications } from './email-trip-notifications';
import { EmailWaitlistNotifications } from './email-waitlist-notifications';
import { MAIL_TRANSPORT } from './mail.transport';
import { MailerService } from './mailer.service';
import { TRIP_NOTIFICATIONS } from './trip-notifications.port';
import { TripReminderJob } from './trip-reminder.job';
import { WAITLIST_NOTIFICATIONS } from './waitlist-notifications.port';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Trip, Booking, Concert, User, WaitlistEntry]),
  ],
  providers: [
    {
      provide: MAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Transporter | null =>
        createMailTransport(config),
    },
    MailerService,
    EmailTripNotifications,
    EmailBookingNotifications,
    EmailWaitlistNotifications,
    { provide: TRIP_NOTIFICATIONS, useExisting: EmailTripNotifications },
    {
      provide: BOOKING_NOTIFICATIONS,
      useExisting: EmailBookingNotifications,
    },
    {
      provide: WAITLIST_NOTIFICATIONS,
      useExisting: EmailWaitlistNotifications,
    },
    TripReminderJob,
  ],
  exports: [TRIP_NOTIFICATIONS, BOOKING_NOTIFICATIONS, WAITLIST_NOTIFICATIONS],
})
export class NotificationsModule {}
