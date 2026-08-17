import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Payload for reviewing a driver after a trip (FR-REV-01).
 * The trip is identified by the route (`POST /trips/:id/reviews`) and the
 * author by the authenticated user.
 */
export class CreateReviewDto {
  @ApiProperty({
    description: 'Star rating',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great playlist and on time.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment: string;
}
