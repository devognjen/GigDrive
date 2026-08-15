import { ConfigService } from '@nestjs/config';
import { TicketmasterService } from './ticketmaster.service';

describe('TicketmasterService', () => {
  const createService = (apiKey: string) => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'ticketmaster.apiKey') {
          return apiKey;
        }
        return fallback;
      }),
    } as unknown as ConfigService;
    return new TicketmasterService(config);
  };

  const okResponse = (body: unknown) =>
    ({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    }) as unknown as Response;

  const tmEvent = {
    id: 'tm-1',
    name: 'Rammstein Live',
    url: 'https://ticketmaster.example/event/tm-1',
    dates: {
      start: {
        dateTime: '2026-07-01T19:00:00Z',
        localDate: '2026-07-01',
        localTime: '21:00:00',
      },
    },
    images: [{ url: 'https://img.example/1.jpg' }],
    classifications: [{ genre: { name: 'Metal' } }],
    _embedded: {
      attractions: [{ name: 'Rammstein' }],
      venues: [
        {
          name: 'Ernst-Happel-Stadion',
          city: { name: 'Vienna' },
          country: { name: 'Austria' },
          location: { latitude: '48.207', longitude: '16.420' },
        },
      ],
    },
  };

  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('isConfigured', () => {
    it('is false without an API key', () => {
      expect(createService('').isConfigured()).toBe(false);
    });

    it('is true with an API key', () => {
      expect(createService('secret').isConfigured()).toBe(true);
    });
  });

  describe('searchEvents', () => {
    it('returns null without an API key and never calls the provider', async () => {
      const result = await createService('').searchEvents({ q: 'Rammstein' });

      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('maps Ticketmaster events to provider concerts', async () => {
      fetchSpy.mockResolvedValue(
        okResponse({ _embedded: { events: [tmEvent] } }),
      );

      const result = await createService('secret').searchEvents({});

      expect(result).toEqual([
        {
          externalId: 'tm-1',
          artist: 'Rammstein',
          title: 'Rammstein Live',
          venue: 'Ernst-Happel-Stadion',
          city: 'Vienna',
          country: 'Austria',
          lat: 48.207,
          lng: 16.42,
          startAt: new Date('2026-07-01T19:00:00Z'),
          imageUrl: 'https://img.example/1.jpg',
          genre: 'Metal',
          ticketUrl: 'https://ticketmaster.example/event/tm-1',
        },
      ]);
    });

    it('falls back to localDate/localTime when dateTime is missing', async () => {
      const event = {
        ...tmEvent,
        dates: { start: { localDate: '2026-07-01', localTime: '21:00:00' } },
      };
      fetchSpy.mockResolvedValue(
        okResponse({ _embedded: { events: [event] } }),
      );

      const result = await createService('secret').searchEvents({});

      expect(result?.[0]?.startAt).toEqual(new Date('2026-07-01T21:00:00Z'));
    });

    it('drops events without an id or a usable start date', async () => {
      const noId = { ...tmEvent, id: undefined };
      const noDate = { ...tmEvent, id: 'tm-2', dates: { start: {} } };
      fetchSpy.mockResolvedValue(
        okResponse({ _embedded: { events: [noId, noDate, tmEvent] } }),
      );

      const result = await createService('secret').searchEvents({});

      expect(result).toHaveLength(1);
      expect(result?.[0]?.externalId).toBe('tm-1');
    });

    it('returns an empty list when the provider has no matches', async () => {
      fetchSpy.mockResolvedValue(okResponse({}));

      const result = await createService('secret').searchEvents({});

      expect(result).toEqual([]);
    });

    it('returns null on non-ok responses (e.g. 429 quota exhausted)', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 429,
      });

      const result = await createService('secret').searchEvents({});

      expect(result).toBeNull();
    });

    it('returns null when the request fails (provider down)', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await createService('secret').searchEvents({});

      expect(result).toBeNull();
    });

    it('builds the provider URL from the search filters', async () => {
      fetchSpy.mockResolvedValue(okResponse({}));

      await createService('secret').searchEvents({
        q: 'Rammstein',
        city: 'Vienna',
        dateFrom: '2026-07-01',
        dateTo: '2026-07-31',
        genre: 'Metal',
        page: 2,
      });

      const calls = fetchSpy.mock.calls as [string][];
      const url = new URL(calls[0][0]);
      expect(url.pathname).toBe('/discovery/v2/events.json');
      expect(url.searchParams.get('apikey')).toBe('secret');
      expect(url.searchParams.get('keyword')).toBe('Rammstein');
      expect(url.searchParams.get('city')).toBe('Vienna');
      expect(url.searchParams.get('startDateTime')).toBe(
        '2026-07-01T00:00:00Z',
      );
      expect(url.searchParams.get('endDateTime')).toBe('2026-07-31T23:59:59Z');
      expect(url.searchParams.get('classificationName')).toBe('Metal');
      expect(url.searchParams.get('page')).toBe('2');
      expect(url.searchParams.get('segmentId')).toBeTruthy();
    });
  });
});
