import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from '../../common/enums';
import { Trip } from '../../trips/entities/trip.entity';

/** Light trip representation shown on the concert details page (FR-CON-03). */
export class ConcertTripDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty()
  departureAt: Date;

  @ApiProperty()
  minPassengers: number;

  @ApiProperty()
  maxPassengers: number;

  @ApiProperty()
  driverId: string;

  @ApiProperty()
  driverName: string;

  static fromEntity(trip: Trip): ConcertTripDto {
    const dto = new ConcertTripDto();
    dto.id = trip.id;
    dto.status = trip.status;
    dto.departureAt = trip.departureAt;
    dto.minPassengers = trip.minPassengers;
    dto.maxPassengers = trip.maxPassengers;
    dto.driverId = trip.driverId;
    dto.driverName = `${trip.driver.firstName} ${trip.driver.lastName}`;
    return dto;
  }
}
