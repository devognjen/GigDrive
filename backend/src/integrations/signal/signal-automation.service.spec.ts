import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Concert } from '../../concerts/entities/concert.entity';
import { Trip } from '../../trips/entities/trip.entity';
import {
  SignalAutomationService,
  signalGroupName,
} from './signal-automation.service';
import { SignalService } from './signal.service';

describe('signalGroupName', () => {
  it('matches 🎵 {Artist} — {City}, {date}', () => {
    expect(
      signalGroupName('Rammstein', 'Vienna', new Date('2026-08-20T19:00:00Z')),
    ).toBe('🎵 Rammstein — Vienna, 20 Aug 2026');
  });
});

describe('SignalAutomationService', () => {
  let service: SignalAutomationService;
  let config: { get: jest.Mock };
  let signal: { isConfigured: jest.Mock; createGroupWithInvite: jest.Mock };
  let notifications: { notify: jest.Mock };
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const trip = {
    id: 'trip-1',
    departureAt: new Date('2026-08-20T15:00:00Z'),
    concert: {
      artist: 'Rammstein',
      city: 'Vienna',
      startAt: new Date('2026-08-20T19:00:00Z'),
    } as Concert,
  } as Trip;

  const invite = {
    id: 'group.abc=',
    name: '🎵 Rammstein — Vienna, 20 Aug 2026',
    inviteLink: 'https://signal.group/#invite',
  };

  beforeEach(() => {
    config = { get: jest.fn().mockReturnValue(true) };
    signal = {
      isConfigured: jest.fn().mockReturnValue(true),
      createGroupWithInvite: jest.fn().mockResolvedValue(invite),
    };
    notifications = { notify: jest.fn().mockResolvedValue(undefined) };
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    service = new SignalAutomationService(
      config as unknown as ConfigService,
      signal as unknown as SignalService,
      notifications,
    );
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  describe('isEnabled', () => {
    it('is true when FEATURE_SIGNAL is on', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('is false when FEATURE_SIGNAL is off', () => {
      config.get.mockReturnValue(false);
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('onTripConfirmed', () => {
    it('does not call signal-cli when the flag is off', async () => {
      config.get.mockReturnValue(false);

      await service.onTripConfirmed(trip);

      expect(signal.createGroupWithInvite).not.toHaveBeenCalled();
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('does not call signal-cli when the number is missing', async () => {
      signal.isConfigured.mockReturnValue(false);

      await service.onTripConfirmed(trip);

      expect(signal.createGroupWithInvite).not.toHaveBeenCalled();
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('creates a group and emails the invite link', async () => {
      await service.onTripConfirmed(trip);

      expect(signal.createGroupWithInvite).toHaveBeenCalledWith(
        '🎵 Rammstein — Vienna, 20 Aug 2026',
      );
      expect(notifications.notify).toHaveBeenCalledWith({
        type: 'SIGNAL_INVITE',
        trip,
        inviteLink: invite.inviteLink,
        groupName: invite.name,
      });
    });

    it('skips email when group creation fails', async () => {
      signal.createGroupWithInvite.mockResolvedValue(null);

      await expect(service.onTripConfirmed(trip)).resolves.toBeUndefined();
      expect(notifications.notify).not.toHaveBeenCalled();
    });

    it('swallows unexpected errors so confirmation can continue', async () => {
      signal.createGroupWithInvite.mockRejectedValue(new Error('timeout'));

      await expect(service.onTripConfirmed(trip)).resolves.toBeUndefined();
      expect(notifications.notify).not.toHaveBeenCalled();
    });
  });
});
