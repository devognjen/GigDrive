import { ApiProperty } from '@nestjs/swagger';
import { TripDto } from '../../trips/dto/trip.dto';
import { WaitlistEntry } from '../entities/waitlist-entry.entity';

/**
 * API representation of a waitlist entry. `position` is 1-based join order
 * among current entries on the same trip (computed, not stored).
 */
export class WaitlistEntryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tripId: string;

  @ApiProperty()
  passengerId: string;

  @ApiProperty()
  seats: number;

  @ApiProperty({ description: '1-based position in join order on this trip' })
  position: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => TripDto })
  trip: TripDto;

  static fromEntity(
    entry: WaitlistEntry,
    trip: TripDto,
    position: number,
  ): WaitlistEntryDto {
    const dto = new WaitlistEntryDto();
    dto.id = entry.id;
    dto.tripId = entry.tripId;
    dto.passengerId = entry.passengerId;
    dto.seats = entry.seats;
    dto.position = position;
    dto.createdAt = entry.createdAt;
    dto.trip = trip;
    return dto;
  }
}
