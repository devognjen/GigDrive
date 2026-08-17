import {
  describeWeatherCode,
  localDateFromUtc,
  mapDailyForecast,
  OpenMeteoDailyPayload,
} from './open-meteo.forecast';

describe('localDateFromUtc', () => {
  it('formats the UTC calendar day when the offset is zero', () => {
    expect(localDateFromUtc(new Date('2026-08-20T19:00:00Z'), 0)).toBe(
      '2026-08-20',
    );
  });

  it('rolls into the next local day when the offset crosses midnight', () => {
    expect(localDateFromUtc(new Date('2026-08-20T22:00:00Z'), 3 * 3600)).toBe(
      '2026-08-21',
    );
  });
});

describe('describeWeatherCode', () => {
  it.each([
    [0, 'Clear'],
    [2, 'Partly cloudy'],
    [3, 'Overcast'],
    [45, 'Fog'],
    [53, 'Drizzle'],
    [61, 'Rain'],
    [75, 'Snow'],
    [81, 'Rain showers'],
    [85, 'Snow showers'],
    [95, 'Thunderstorm'],
    [123, 'Unknown'],
  ] as const)('maps WMO code %s to %s', (code, label) => {
    expect(describeWeatherCode(code)).toBe(label);
  });
});

describe('mapDailyForecast', () => {
  const payload = (
    overrides: Partial<OpenMeteoDailyPayload> = {},
  ): OpenMeteoDailyPayload => ({
    utc_offset_seconds: 7200,
    daily: {
      time: ['2026-08-20', '2026-08-21', '2026-08-22'],
      weather_code: [0, 61, 3],
      temperature_2m_min: [12.1, 14.0, 11.5],
      temperature_2m_max: [24.4, 22.0, 19.2],
      precipitation_sum: [0, 4.2, 1],
    },
    ...overrides,
  });

  it('maps the daily row for the concert local date', () => {
    expect(
      mapDailyForecast(payload(), new Date('2026-08-21T18:00:00Z')),
    ).toEqual({
      status: 'ok',
      forecast: {
        date: '2026-08-21',
        weatherCode: 61,
        description: 'Rain',
        tempMinC: 14,
        tempMaxC: 22,
        precipitationMm: 4.2,
      },
    });
  });

  it('uses the venue offset so a late UTC start stays on the local day', () => {
    // 22:00 UTC + 2h = 00:00 next local day.
    expect(
      mapDailyForecast(payload(), new Date('2026-08-20T22:00:00Z')),
    ).toEqual({
      status: 'ok',
      forecast: {
        date: '2026-08-21',
        weatherCode: 61,
        description: 'Rain',
        tempMinC: 14,
        tempMaxC: 22,
        precipitationMm: 4.2,
      },
    });
  });

  it('returns out_of_range when the concert day is not in the forecast', () => {
    expect(
      mapDailyForecast(payload(), new Date('2026-09-01T18:00:00Z')),
    ).toEqual({ status: 'out_of_range' });
  });

  it('returns unavailable when daily data is missing', () => {
    expect(mapDailyForecast({}, new Date('2026-08-21T18:00:00Z'))).toEqual({
      status: 'unavailable',
    });
  });

  it('returns unavailable when the matching row is incomplete', () => {
    expect(
      mapDailyForecast(
        payload({
          daily: {
            time: ['2026-08-21'],
            weather_code: [61],
            temperature_2m_min: [14],
            temperature_2m_max: [22],
          },
        }),
        new Date('2026-08-21T18:00:00Z'),
      ),
    ).toEqual({ status: 'unavailable' });
  });
});
