/** Open-Meteo forecast horizon used for concert-day lookups. */
export const FORECAST_DAYS = 16;

/** Daily forecast for a single local calendar day at the venue. */
export interface DailyForecast {
  date: string;
  weatherCode: number;
  description: string;
  tempMinC: number;
  tempMaxC: number;
  precipitationMm: number;
}

export type ForecastLookup =
  | { status: 'ok'; forecast: DailyForecast }
  | { status: 'out_of_range' }
  | { status: 'unavailable' };

/** Minimal typing of the Open-Meteo daily payload; only fields we consume. */
export interface OpenMeteoDailyPayload {
  utc_offset_seconds?: number;
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    precipitation_sum?: number[];
  };
}

/**
 * Venue-local YYYY-MM-DD of an instant, using the offset Open-Meteo reports
 * for the coordinates (`timezone=auto`).
 */
export function localDateFromUtc(utc: Date, utcOffsetSeconds: number): string {
  const local = new Date(utc.getTime() + utcOffsetSeconds * 1000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Short label for a WMO weather interpretation code. */
export function describeWeatherCode(code: number): string {
  if (code === 0) {
    return 'Clear';
  }
  if (code === 1 || code === 2) {
    return 'Partly cloudy';
  }
  if (code === 3) {
    return 'Overcast';
  }
  if (code === 45 || code === 48) {
    return 'Fog';
  }
  if (code >= 51 && code <= 57) {
    return 'Drizzle';
  }
  if (code >= 61 && code <= 67) {
    return 'Rain';
  }
  if (code === 71 || code === 73 || code === 75 || code === 77) {
    return 'Snow';
  }
  if (code >= 80 && code <= 82) {
    return 'Rain showers';
  }
  if (code === 85 || code === 86) {
    return 'Snow showers';
  }
  if (code === 95 || code === 96 || code === 99) {
    return 'Thunderstorm';
  }
  return 'Unknown';
}

/**
 * Picks the daily row that matches the concert's local calendar day.
 * Missing daily data is treated as a provider failure; a date that is not
 * among the returned days is out of the forecast range.
 */
export function mapDailyForecast(
  payload: OpenMeteoDailyPayload,
  concertStartAt: Date,
): ForecastLookup {
  const daily = payload.daily;
  const times = daily?.time;
  if (!times || times.length === 0) {
    return { status: 'unavailable' };
  }

  const localDate = localDateFromUtc(
    concertStartAt,
    payload.utc_offset_seconds ?? 0,
  );
  const index = times.indexOf(localDate);
  if (index < 0) {
    return { status: 'out_of_range' };
  }

  const weatherCode = daily.weather_code?.[index];
  const tempMinC = daily.temperature_2m_min?.[index];
  const tempMaxC = daily.temperature_2m_max?.[index];
  const precipitationMm = daily.precipitation_sum?.[index];
  if (
    weatherCode === undefined ||
    tempMinC === undefined ||
    tempMaxC === undefined ||
    precipitationMm === undefined ||
    !Number.isFinite(weatherCode) ||
    !Number.isFinite(tempMinC) ||
    !Number.isFinite(tempMaxC) ||
    !Number.isFinite(precipitationMm)
  ) {
    return { status: 'unavailable' };
  }

  return {
    status: 'ok',
    forecast: {
      date: localDate,
      weatherCode,
      description: describeWeatherCode(weatherCode),
      tempMinC,
      tempMaxC,
      precipitationMm,
    },
  };
}
