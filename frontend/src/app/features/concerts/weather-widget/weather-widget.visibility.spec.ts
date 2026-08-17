import { ConcertWeather } from '../../../core/models/concert.model';
import { shouldShowWeatherWidget, weatherEmptyMessage } from './weather-widget.visibility';

const forecast: ConcertWeather = {
  available: true,
  date: '2026-08-23',
  weatherCode: 0,
  description: 'Clear',
  tempMinC: 12.4,
  tempMaxC: 24.1,
  precipitationMm: 0,
};

describe('shouldShowWeatherWidget', () => {
  it('shows a successful forecast', () => {
    expect(shouldShowWeatherWidget(forecast)).toBe(true);
  });

  it('shows empty states for missing coordinates and out-of-range dates', () => {
    expect(shouldShowWeatherWidget({ available: false, reason: 'NO_COORDINATES' })).toBe(true);
    expect(shouldShowWeatherWidget({ available: false, reason: 'OUT_OF_RANGE' })).toBe(true);
  });

  it('hides the widget on provider failure or a missing payload', () => {
    expect(shouldShowWeatherWidget(null)).toBe(false);
    expect(shouldShowWeatherWidget({ available: false, reason: 'UNAVAILABLE' })).toBe(false);
  });
});

describe('weatherEmptyMessage', () => {
  it('explains missing coordinates', () => {
    expect(weatherEmptyMessage({ available: false, reason: 'NO_COORDINATES' })).toContain(
      'no location coordinates',
    );
  });

  it('explains an out-of-range concert date', () => {
    expect(weatherEmptyMessage({ available: false, reason: 'OUT_OF_RANGE' })).toContain(
      '16-day forecast',
    );
  });
});
