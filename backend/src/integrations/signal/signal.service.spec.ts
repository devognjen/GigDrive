import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignalService } from './signal.service';

describe('SignalService', () => {
  const number = '+43000000000';
  const baseUrl = 'http://signal-cli:8080';

  const createService = (signalNumber = number) => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'signal.number') {
          return signalNumber;
        }
        if (key === 'signal.cliUrl') {
          return baseUrl;
        }
        return fallback;
      }),
    } as unknown as ConfigService;
    return new SignalService(config);
  };

  const jsonResponse = (status: number, body: unknown) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }) as unknown as Response;

  let fetchSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    warnSpy.mockRestore();
  });

  describe('isConfigured', () => {
    it('is false without a Signal number', () => {
      expect(createService('').isConfigured()).toBe(false);
    });

    it('is true with a Signal number', () => {
      expect(createService(number).isConfigured()).toBe(true);
    });
  });

  describe('createGroupWithInvite', () => {
    it('returns null without a number and never calls signal-cli', async () => {
      const result = await createService('').createGroupWithInvite('Crew');

      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('creates a group with an invite link and empty members', async () => {
      fetchSpy
        .mockResolvedValueOnce(jsonResponse(201, { id: 'group.abc=' }))
        .mockResolvedValueOnce(
          jsonResponse(200, {
            id: 'group.abc=',
            name: '🎵 Rammstein — Vienna, 20 Aug 2026',
            invite_link: 'https://signal.group/#invite',
          }),
        );

      const result = await createService().createGroupWithInvite(
        '🎵 Rammstein — Vienna, 20 Aug 2026',
      );

      expect(result).toEqual({
        id: 'group.abc=',
        name: '🎵 Rammstein — Vienna, 20 Aug 2026',
        inviteLink: 'https://signal.group/#invite',
      });

      const calls = fetchSpy.mock.calls as [string, RequestInit][];
      expect(calls[0][0]).toBe(
        `${baseUrl}/v1/groups/${encodeURIComponent(number)}`,
      );
      const createBody = calls[0][1].body;
      expect(typeof createBody).toBe('string');
      if (typeof createBody !== 'string') {
        return;
      }
      expect(JSON.parse(createBody)).toEqual({
        name: '🎵 Rammstein — Vienna, 20 Aug 2026',
        members: [],
        group_link: 'enabled',
      });
      expect(calls[1][0]).toBe(
        `${baseUrl}/v1/groups/${encodeURIComponent(number)}/${encodeURIComponent('group.abc=')}`,
      );
    });

    it('returns null when create-group fails', async () => {
      fetchSpy.mockResolvedValue(jsonResponse(400, { error: 'bad' }));

      await expect(
        createService().createGroupWithInvite('Crew'),
      ).resolves.toBeNull();
    });

    it('returns null when the invite link is missing', async () => {
      fetchSpy
        .mockResolvedValueOnce(jsonResponse(201, { id: 'group.abc=' }))
        .mockResolvedValueOnce(jsonResponse(200, { id: 'group.abc=' }));

      await expect(
        createService().createGroupWithInvite('Crew'),
      ).resolves.toBeNull();
    });

    it('returns null when signal-cli is unreachable', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(
        createService().createGroupWithInvite('Crew'),
      ).resolves.toBeNull();
    });
  });
});
