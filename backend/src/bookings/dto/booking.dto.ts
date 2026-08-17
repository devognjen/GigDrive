import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../common/enums';
import { TripDto } from '../../trips/dto/trip.dto';
import { Booking } from '../entities/booking.entity';

/**
 * API representation of a booking. Exposes the passenger's id so guards and
 * UI can distinguish ownership without inflating the full user entity.
 * Nested `trip` carries live price and concert summary for dashboards.
 */
export class BookingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tripId: string;

  @ApiProperty()
  passengerId: string;

  @ApiProperty({ description: 'Display name of the passenger' })
  passengerName: string;

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

  @ApiProperty({ type: () => TripDto })
  trip: TripDto;

  static fromEntity(
    booking: Booking,
    trip: TripDto,
    passengerName: string,
  ): BookingDto {
    const dto = new BookingDto();
    dto.id = booking.id;
    dto.tripId = booking.tripId;
    dto.passengerId = booking.passengerId;
    dto.passengerName = passengerName;
    dto.seats = booking.seats;
    dto.status = booking.status;
    dto.paid = booking.paid;
    dto.createdAt = booking.createdAt;
    dto.decidedAt = booking.decidedAt;
    dto.trip = trip;
    return dto;
  }
}
