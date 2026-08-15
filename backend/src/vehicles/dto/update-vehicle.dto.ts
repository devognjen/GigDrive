import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { VehicleType } from '../../common/enums';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  model?: string;

  @ApiPropertyOptional({
    description:
      'Total passenger seats offered for trips (excludes the driver)',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  seats?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
