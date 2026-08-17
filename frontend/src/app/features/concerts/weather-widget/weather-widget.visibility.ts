import { ConcertWeather } from '../../../core/models/concert.model';

/** Widget is shown for a forecast or a user-facing empty state, never on failure. */
export function shouldShowWeatherWidget(weather: ConcertWeather | null): boolean {
  if (!weather) {
    return false;
  }
  if (weather.available) {
    return true;
  }
  return weather.reason === 'NO_COORDINATES' || weather.reason === 'OUT_OF_RANGE';
}

export function weatherEmptyMessage(weather: ConcertWeather): string {
  if (weather.reason === 'NO_COORDINATES') {
    return 'No forecast — this concert has no location coordinates.';
  }
  if (weather.reason === 'OUT_OF_RANGE') {
    return 'No forecast — the concert date is outside the 16-day forecast window.';
  }
  return '';
}
