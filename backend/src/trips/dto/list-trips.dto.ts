import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { VehicleType } from '../../common/enums';

/**
 * Filter/sort query params for GET /trips and GET /trips/mine (FR-TRIP-03).
 * All filters are optional and combine with AND semantics.
 */
export class ListTripsDto {
  @ApiPropertyOptional({ description: 'Return only trips to this concert' })
  @IsOptional()
  @IsUUID()
  concertId?: string;

  @ApiPropertyOptional({
    description: 'Departure city (matches the first stop)',
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({
    description: 'Maximum live per-person price (minor units)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum driver rating (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Minimum remaining (free) seats' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  seatsMin?: number;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['cheapest', 'likely'],
  })
  @IsOptional()
  @IsString()
  sort?: string;
}
