import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { VehicleType } from '../../common/enums';

export class CreateVehicleDto {
  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  type: VehicleType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  make: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({
    description:
      'Total passenger seats offered for trips (excludes the driver)',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  seats: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
