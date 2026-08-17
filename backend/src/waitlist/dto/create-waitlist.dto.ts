import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/**
 * Payload for joining a FULL trip's waitlist (FR-BOOK-05).
 *
 * The trip is identified by the route (`POST /trips/:id/waitlist`) and the
 * passenger by the authenticated user. Requested seats are informational —
 * joining never reserves capacity or changes live price.
 */
export class CreateWaitlistDto {
  @ApiProperty({
    description: 'Number of seats the passenger hopes to book',
    minimum: 1,
    example: 2,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats: number;
}
