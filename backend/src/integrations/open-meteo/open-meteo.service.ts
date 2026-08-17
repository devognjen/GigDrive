import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FORECAST_DAYS,
  ForecastLookup,
  mapDailyForecast,
  OpenMeteoDailyPayload,
} from './open-meteo.forecast';

const REQUEST_TIMEOUT_MS = 5000;
const DAILY_VARS =
  'weather_code,temperature_2m_min,temperature_2m_max,precipitation_sum';

/**
 * Thin client for the Open-Meteo Forecast API. All provider access is
 * proxied through the backend (architectural rule, PRD §10); no API key
 * is required. Failures are reported as `unavailable` so callers can
 * hide the widget without affecting the rest of the page.
 */
@Injectable()
export class OpenMeteoService {
  private readonly logger = new Logger(OpenMeteoService.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>(
      'openMeteo.baseUrl',
      'https://api.open-meteo.com',
    );
  }

  /**
   * Daily forecast for `at` at the given coordinates. The concert's local
   * calendar day is resolved from Open-Meteo's `timezone=auto` offset.
   */
  async getForecastForDate(
    lat: number,
    lng: number,
    at: Date,
  ): Promise<ForecastLookup> {
    try {
      const response = await fetch(this.buildUrl(lat, lng), {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.warn(`Open-Meteo responded with HTTP ${response.status}`);
        return { status: 'unavailable' };
      }
      const payload = (await response.json()) as OpenMeteoDailyPayload;
      return mapDailyForecast(payload, at);
    } catch (error) {
      this.logger.warn(
        `Open-Meteo request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { status: 'unavailable' };
    }
  }

  private buildUrl(lat: number, lng: number): string {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      daily: DAILY_VARS,
      forecast_days: String(FORECAST_DAYS),
      timezone: 'auto',
    });
    return `${this.baseUrl}/v1/forecast?${params.toString()}`;
  }
}
