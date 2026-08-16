import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../common/enums';
import { Booking } from '../entities/booking.entity';

/**
 * API representation of a booking. Exposes the passenger's id so guards and
 * UI can distinguish ownership without inflating the full user entity.
 */
export class BookingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tripId: string;

  @ApiProperty()
  passengerId: string;

  @ApiProperty()
  seats: number;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ description: 'Informational paid flag (driver-set)' })
  paid: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ nullable: true })
  decidedAt: Date | null;

  static fromEntity(booking: Booking): BookingDto {
    const dto = new BookingDto();
    dto.id = booking.id;
    dto.tripId = booking.tripId;
    dto.passengerId = booking.passengerId;
    dto.seats = booking.seats;
    dto.status = booking.status;
    dto.paid = booking.paid;
    dto.createdAt = booking.createdAt;
    dto.decidedAt = booking.decidedAt;
    return dto;
  }
}
