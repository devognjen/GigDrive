import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '../../common/enums';
import { Vehicle } from '../entities/vehicle.entity';

/** API representation of a user's vehicle. */
export class VehicleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty({ enum: VehicleType })
  type: VehicleType;

  @ApiProperty()
  make: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  seats: number;

  @ApiProperty({ nullable: true })
  notes: string | null;

  static fromEntity(vehicle: Vehicle): VehicleDto {
    const dto = new VehicleDto();
    dto.id = vehicle.id;
    dto.ownerId = vehicle.ownerId;
    dto.type = vehicle.type;
    dto.make = vehicle.make;
    dto.model = vehicle.model;
    dto.seats = vehicle.seats;
    dto.notes = vehicle.notes;
    return dto;
  }
}
