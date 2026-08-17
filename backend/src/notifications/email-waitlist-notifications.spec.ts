import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Concert } from '../concerts/entities/concert.entity';
import { Trip } from '../trips/entities/trip.entity';
import { User } from '../users/entities/user.entity';
import { WaitlistEntry } from '../waitlist/entities/waitlist-entry.entity';
import { EmailWaitlistNotifications } from './email-waitlist-notifications';
import { RenderedEmail } from './email-templates';
import { MailerService } from './mailer.service';

describe('EmailWaitlistNotifications', () => {
  let service: EmailWaitlistNotifications;
  let mailer: { sendToUser: jest.Mock };
  let waitlistRepository: { findOne: jest.Mock };

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

  const entry = {
    id: 'entry-1',
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
  } as WaitlistEntry;

  beforeEach(async () => {
    mailer = { sendToUser: jest.fn().mockResolvedValue(undefined) };
    waitlistRepository = { findOne: jest.fn().mockResolvedValue(entry) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailWaitlistNotifications,
        { provide: MailerService, useValue: mailer },
        {
          provide: getRepositoryToken(WaitlistEntry),
          useValue: waitlistRepository,
        },
      ],
    }).compile();

    service = module.get(EmailWaitlistNotifications);
  });

  const sendCalls = () =>
    mailer.sendToUser.mock.calls as [User, RenderedEmail][];

  it('emails the waitlisted passenger when a seat frees', async () => {
    await service.notify({
      type: 'WAITLIST_SEAT_AVAILABLE',
      entry,
      position: 1,
    });

    expect(sendCalls()[0][0].id).toBe(passenger.id);
    expect(sendCalls()[0][1].subject).toContain('A seat opened');
    expect(sendCalls()[0][1].text).toContain('#1');
    expect(sendCalls()[0][1].text).toContain('2 seats');
  });

  it('does nothing when the entry cannot be reloaded', async () => {
    waitlistRepository.findOne.mockResolvedValue(null);

    await service.notify({
      type: 'WAITLIST_SEAT_AVAILABLE',
      entry,
      position: 2,
    });

    expect(mailer.sendToUser).not.toHaveBeenCalled();
  });
});
