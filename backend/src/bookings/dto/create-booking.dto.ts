import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

/**
 * Payload for requesting seats on a trip (FR-BOOK-01).
 *
 * Only the number of seats is supplied — the trip is identified by the route
 * (`POST /trips/:id/bookings`) and the passenger by the authenticated user.
 * The remaining-capacity bound is a *soft* check at request time; the
 * authoritative capacity re-check happens inside the accept-time transaction.
 */
export class CreateBookingDto {
  @ApiProperty({
    description: 'Number of seats requested',
    minimum: 1,
    example: 2,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats: number;
}
