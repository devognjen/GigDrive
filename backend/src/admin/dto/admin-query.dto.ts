import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TripStatus } from '../../common/enums';

function toOptionalBoolean({ value }: { value: unknown }): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}

export class ListAdminUsersDto {
  @ApiPropertyOptional({ description: 'Search email or name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;
}

export class ListAdminConcertsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  userSubmitted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  hidden?: boolean;
}

export class ListAdminTripsDto {
  @ApiPropertyOptional({ enum: TripStatus })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
