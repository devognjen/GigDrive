import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Currency, PricingMode } from '../../common/enums';
import { TripStopDto } from './trip-stop.dto';

/**
 * Payload for creating a shared-ride trip (FR-TRIP-01).
 *
 * Cross-field validation (`min ≤ max ≤ vehicle.seats`, deadline before the
 * concert date) is enforced in TripsService, which has access to the vehicle
 * and concert entities.
 */
export class CreateTripDto {
  @ApiProperty({ description: 'Vehicle used for this trip' })
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ description: 'Concert this trip travels to' })
  @IsUUID()
  concertId: string;

  @ApiProperty({ enum: PricingMode })
  @IsEnum(PricingMode)
  pricingMode: PricingMode;

  @ApiProperty({ description: 'Cost pool in minor currency units (cents)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalCost: number;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ description: 'Go/no-go passenger threshold', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minPassengers: number;

  @ApiProperty({ description: 'Maximum passengers (≤ vehicle seats)', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxPassengers: number;

  @ApiProperty({ description: 'Go/no-go decision deadline as ISO 8601 timestamp' })
  @IsDateString()
  confirmationDeadline: string;

  @ApiProperty({ description: 'Departure date/time as ISO 8601 timestamp' })
  @IsDateString()
  departureAt: string;

  @ApiPropertyOptional({ description: 'Whether the driver offers a return leg' })
  @IsOptional()
  @IsBoolean()
  roundTrip?: boolean;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ type: [TripStopDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripStopDto)
  stops: TripStopDto[];
}
