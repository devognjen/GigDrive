import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DailyForecast } from '../../integrations/open-meteo/open-meteo.forecast';

export enum WeatherUnavailableReason {
  NoCoordinates = 'NO_COORDINATES',
  OutOfRange = 'OUT_OF_RANGE',
  Unavailable = 'UNAVAILABLE',
}

/** Concert-day forecast as returned by GET /concerts/:id/weather. */
export class ConcertWeatherDto {
  @ApiProperty()
  available: boolean;

  @ApiPropertyOptional({ enum: WeatherUnavailableReason })
  reason?: WeatherUnavailableReason;

  @ApiPropertyOptional({ description: 'Venue-local calendar day (YYYY-MM-DD)' })
  date?: string;

  @ApiPropertyOptional({ description: 'WMO weather interpretation code' })
  weatherCode?: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  tempMinC?: number;

  @ApiPropertyOptional()
  tempMaxC?: number;

  @ApiPropertyOptional()
  precipitationMm?: number;

  static fromForecast(forecast: DailyForecast): ConcertWeatherDto {
    const dto = new ConcertWeatherDto();
    dto.available = true;
    dto.date = forecast.date;
    dto.weatherCode = forecast.weatherCode;
    dto.description = forecast.description;
    dto.tempMinC = forecast.tempMinC;
    dto.tempMaxC = forecast.tempMaxC;
    dto.precipitationMm = forecast.precipitationMm;
    return dto;
  }

  static unavailable(reason: WeatherUnavailableReason): ConcertWeatherDto {
    const dto = new ConcertWeatherDto();
    dto.available = false;
    dto.reason = reason;
    return dto;
  }
}
