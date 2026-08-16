import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * Payload for toggling a booking's paid flag (FR-BOOK-04).
 */
export class UpdateBookingPaidDto {
  @ApiProperty({ description: 'Whether the driver has received payment' })
  @IsBoolean()
  paid: boolean;
}
