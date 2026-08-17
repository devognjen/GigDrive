import { ConfigService } from '@nestjs/config';
import { OpenMeteoService } from './open-meteo.service';

describe('OpenMeteoService', () => {
  const createService = (
    baseUrl = 'https://api.open-meteo.com',
  ): OpenMeteoService => {
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'openMeteo.baseUrl') {
          return baseUrl;
        }
        return fallback;
      }),
    } as unknown as ConfigService;
    return new OpenMeteoService(config);
  };

  const okResponse = (body: unknown) =>
    ({
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    }) as unknown as Response;

  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('getForecastForDate', () => {
    it('requests the daily forecast and maps the concert day', async () => {
      fetchSpy.mockResolvedValue(
        okResponse({
          utc_offset_seconds: 7200,
          daily: {
            time: ['2026-08-20', '2026-08-21'],
            weather_code: [0, 3],
            temperature_2m_min: [12, 11],
            temperature_2m_max: [24, 19],
            precipitation_sum: [0, 1.5],
          },
        }),
      );

      const result = await createService().getForecastForDate(
        44.8141,
        20.4212,
        new Date('2026-08-21T18:00:00Z'),
      );

      expect(result).toEqual({
        status: 'ok',
        forecast: {
          date: '2026-08-21',
          weatherCode: 3,
          description: 'Overcast',
          tempMinC: 11,
          tempMaxC: 19,
          precipitationMm: 1.5,
        },
      });

      const url = new URL((fetchSpy.mock.calls as [string][])[0][0]);
      expect(url.origin + url.pathname).toBe(
        'https://api.open-meteo.com/v1/forecast',
      );
      expect(url.searchParams.get('latitude')).toBe('44.8141');
      expect(url.searchParams.get('longitude')).toBe('20.4212');
      expect(url.searchParams.get('daily')).toContain('weather_code');
      expect(url.searchParams.get('forecast_days')).toBe('16');
      expect(url.searchParams.get('timezone')).toBe('auto');
    });

    it('returns unavailable on a non-ok response', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 500 });

      const result = await createService().getForecastForDate(
        44.8,
        20.4,
        new Date('2026-08-21T18:00:00Z'),
      );

      expect(result).toEqual({ status: 'unavailable' });
    });

    it('returns unavailable when the request fails', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await createService().getForecastForDate(
        44.8,
        20.4,
        new Date('2026-08-21T18:00:00Z'),
      );

      expect(result).toEqual({ status: 'unavailable' });
    });
  });
});
