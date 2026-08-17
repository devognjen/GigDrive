import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingStatus } from '../common/enums';
import { Booking } from '../bookings/entities/booking.entity';
import { Concert } from '../concerts/entities/concert.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { EmailTripNotifications } from './email-trip-notifications';
import { RenderedEmail } from './email-templates';
import { MailerService } from './mailer.service';

describe('EmailTripNotifications', () => {
  let service: EmailTripNotifications;
  let mailer: { sendToUser: jest.Mock };
  let tripsRepository: { findOne: jest.Mock };
  let bookingsRepository: { find: jest.Mock };
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const driver = {
    id: 'driver-1',
    email: 'dana@example.com',
    firstName: 'Dana',
    lastName: 'Driver',
    emailNotifications: true,
  } as User;

  const confirmedPassenger = {
    id: 'passenger-1',
    email: 'pat@example.com',
    firstName: 'Pat',
    lastName: 'Rider',
    emailNotifications: true,
  } as User;

  const pendingPassenger = {
    id: 'passenger-2',
    email: 'kim@example.com',
    firstName: 'Kim',
    lastName: 'Wait',
    emailNotifications: true,
  } as User;

  const concert = {
    artist: 'Rammstein',
    city: 'Vienna',
    venue: 'Ernst-Happel-Stadion',
    startAt: new Date('2026-08-20T19:00:00Z'),
  } as Concert;

  const trip = {
    id: 'trip-1',
    driverId: driver.id,
    driver,
    concert,
    departureAt: new Date('2026-08-20T15:00:00Z'),
  } as Trip;

  beforeEach(async () => {
    mailer = { sendToUser: jest.fn().mockResolvedValue(undefined) };
    tripsRepository = { findOne: jest.fn().mockResolvedValue(trip) };
    bookingsRepository = { find: jest.fn().mockResolvedValue([]) };
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailTripNotifications,
        { provide: MailerService, useValue: mailer },
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
      ],
    }).compile();

    service = module.get(EmailTripNotifications);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  const sendCalls = () =>
    mailer.sendToUser.mock.calls as [User, RenderedEmail][];

  const recipientIds = () => sendCalls().map(([user]) => user.id);

  it('emails only the driver when a trip becomes READY', async () => {
    await service.notify({ type: 'TRIP_READY', trip });

    expect(bookingsRepository.find).not.toHaveBeenCalled();
    expect(recipientIds()).toEqual([driver.id]);
    expect(sendCalls()[0][1].subject).toContain('ready');
  });

  it('emails the driver and confirmed passengers on CONFIRMED', async () => {
    bookingsRepository.find.mockResolvedValue([
      { passenger: confirmedPassenger, status: BookingStatus.Confirmed },
    ]);

    await service.notify({ type: 'TRIP_CONFIRMED', trip });

    expect(recipientIds()).toEqual([driver.id, confirmedPassenger.id]);
  });

  it('emails driver, confirmed, and pending passengers on CANCELLED', async () => {
    bookingsRepository.find.mockResolvedValue([
      { passenger: confirmedPassenger, status: BookingStatus.Confirmed },
      { passenger: pendingPassenger, status: BookingStatus.Pending },
    ]);

    await service.notify({ type: 'TRIP_CANCELLED', trip });

    expect(recipientIds()).toEqual([
      driver.id,
      confirmedPassenger.id,
      pendingPassenger.id,
    ]);
  });

  it('emails the driver and confirmed passengers on T-24h reminder', async () => {
    bookingsRepository.find.mockResolvedValue([
      { passenger: confirmedPassenger, status: BookingStatus.Confirmed },
    ]);

    await service.notify({ type: 'TRIP_REMINDER', trip });

    expect(recipientIds()).toEqual([driver.id, confirmedPassenger.id]);
    expect(sendCalls()[0][1].subject).toContain('tomorrow');
  });

  it('does not send email for TRIP_COMPLETED', async () => {
    await service.notify({ type: 'TRIP_COMPLETED', trip });

    expect(tripsRepository.findOne).not.toHaveBeenCalled();
    expect(mailer.sendToUser).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TRIP_COMPLETED]'),
    );
  });

  it('swallows lookup errors so trip transitions still succeed', async () => {
    tripsRepository.findOne.mockRejectedValue(new Error('db down'));

    await expect(
      service.notify({ type: 'TRIP_READY', trip }),
    ).resolves.toBeUndefined();
    expect(mailer.sendToUser).not.toHaveBeenCalled();
  });
});
