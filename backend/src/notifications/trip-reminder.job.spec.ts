import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TripStatus } from '../common/enums';
import { Trip } from '../trips/entities/trip.entity';
import { TRIP_NOTIFICATIONS } from './trip-notifications.port';
import { TripReminderJob } from './trip-reminder.job';

describe('TripReminderJob', () => {
  let job: TripReminderJob;
  let tripsRepository: { find: jest.Mock };
  let notifications: { notify: jest.Mock };
  let errorSpy: jest.SpyInstance;

  const trip = { id: 'trip-1', status: TripStatus.Confirmed } as Trip;

  beforeEach(async () => {
    tripsRepository = { find: jest.fn().mockResolvedValue([]) };
    notifications = { notify: jest.fn().mockResolvedValue(undefined) };
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripReminderJob,
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
        { provide: TRIP_NOTIFICATIONS, useValue: notifications },
      ],
    }).compile();

    job = module.get(TripReminderJob);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('notifies confirmed trips whose departure is 24–25h away', async () => {
    const now = new Date('2026-08-17T12:00:00.000Z');
    tripsRepository.find.mockResolvedValue([trip]);

    const sent = await job.sendDueReminders(now);

    expect(sent).toBe(1);
    expect(tripsRepository.find).toHaveBeenCalledTimes(1);
    expect(notifications.notify).toHaveBeenCalledWith({
      type: 'TRIP_REMINDER',
      trip,
    });
  });

  it('returns 0 and does not notify when no trips are in the window', async () => {
    const sent = await job.sendDueReminders(
      new Date('2026-08-17T12:00:00.000Z'),
    );

    expect(sent).toBe(0);
    expect(notifications.notify).not.toHaveBeenCalled();
  });

  it('does not crash the scheduler when the query fails', async () => {
    tripsRepository.find.mockRejectedValue(new Error('db down'));

    await expect(job.remind()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      'T-24h reminder sweep failed',
      expect.any(Error),
    );
  });
});
