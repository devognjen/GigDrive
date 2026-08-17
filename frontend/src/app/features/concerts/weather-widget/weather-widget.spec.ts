import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcertWeather } from '../../../core/models/concert.model';
import { WeatherWidget } from './weather-widget';

const forecast: ConcertWeather = {
  available: true,
  date: '2026-08-23',
  weatherCode: 61,
  description: 'Rain',
  tempMinC: 14.2,
  tempMaxC: 22.6,
  precipitationMm: 4.2,
};

describe('WeatherWidget', () => {
  let fixture: ComponentFixture<WeatherWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherWidget);
  });

  it('renders the forecast for the concert day', () => {
    fixture.componentRef.setInput('weather', forecast);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Weather on the concert day');
    expect(text).toContain('Rain');
    expect(text).toContain('14–23 °C');
    expect(text).toContain('4.2 mm');
  });

  it('shows an empty state when the concert has no coordinates', () => {
    fixture.componentRef.setInput('weather', { available: false, reason: 'NO_COORDINATES' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('no location coordinates');
  });

  it('renders nothing when the provider failed', () => {
    fixture.componentRef.setInput('weather', { available: false, reason: 'UNAVAILABLE' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.weather-widget')).toBeNull();
  });

  it('renders nothing when weather is null', () => {
    fixture.componentRef.setInput('weather', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.weather-widget')).toBeNull();
  });
});
