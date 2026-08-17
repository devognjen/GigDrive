import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Concert } from '../concerts/entities/concert.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { EmailBookingNotifications } from './email-booking-notifications';
import { RenderedEmail } from './email-templates';
import { MailerService } from './mailer.service';

describe('EmailBookingNotifications', () => {
  let service: EmailBookingNotifications;
  let mailer: { sendToUser: jest.Mock };
  let bookingsRepository: { findOne: jest.Mock };

  const driver = {
    id: 'driver-1',
    email: 'dana@example.com',
    firstName: 'Dana',
    lastName: 'Driver',
    emailNotifications: true,
  } as User;

  const passenger = {
    id: 'passenger-1',
    email: 'pat@example.com',
    firstName: 'Pat',
    lastName: 'Rider',
    emailNotifications: true,
  } as User;

  const booking = {
    id: 'booking-1',
    seats: 2,
    passenger,
    trip: {
      id: 'trip-1',
      driver,
      departureAt: new Date('2026-08-20T15:00:00Z'),
      concert: {
        artist: 'Rammstein',
        city: 'Vienna',
        venue: 'Ernst-Happel-Stadion',
        startAt: new Date('2026-08-20T19:00:00Z'),
      } as Concert,
    } as Trip,
  } as Booking;

  beforeEach(async () => {
    mailer = { sendToUser: jest.fn().mockResolvedValue(undefined) };
    bookingsRepository = { findOne: jest.fn().mockResolvedValue(booking) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailBookingNotifications,
        { provide: MailerService, useValue: mailer },
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
      ],
    }).compile();

    service = module.get(EmailBookingNotifications);
  });

  const sendCalls = () =>
    mailer.sendToUser.mock.calls as [User, RenderedEmail][];
  const recipient = () => sendCalls()[0][0];
  const rendered = () => sendCalls()[0][1];

  it('emails the driver when a booking is requested', async () => {
    await service.notify({ type: 'BOOKING_REQUESTED', booking });

    expect(recipient().id).toBe(driver.id);
    expect(rendered().subject).toContain('New booking request');
    expect(rendered().text).toContain('2 seats');
  });

  it('emails the passenger when a booking is accepted', async () => {
    await service.notify({ type: 'BOOKING_ACCEPTED', booking });

    expect(recipient().id).toBe(passenger.id);
    expect(rendered().subject).toContain('accepted');
  });

  it('emails the passenger when a booking is rejected', async () => {
    await service.notify({ type: 'BOOKING_REJECTED', booking });

    expect(recipient().id).toBe(passenger.id);
    expect(rendered().subject).toContain('declined');
  });

  it('does nothing when the booking cannot be reloaded', async () => {
    bookingsRepository.findOne.mockResolvedValue(null);

    await service.notify({ type: 'BOOKING_REQUESTED', booking });

    expect(mailer.sendToUser).not.toHaveBeenCalled();
  });
});
