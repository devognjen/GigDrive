import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * A pickup stop along a trip's route. `seq` orders the stops (starting at 1)
 * and is unique per trip; `lat`/`lng` and `plannedTime` are optional.
 */
export class TripStopDto {
  @ApiProperty({ description: 'Position in the route, starting at 1' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seq: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  place: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  lat?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Type(() => Number)
  lng?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Planned arrival/departure as ISO 8601 timestamp',
  })
  @IsOptional()
  @IsString()
  plannedTime?: string | null;
}
