import { ApiProperty } from '@nestjs/swagger';

/**
 * Public profile of any user — no contact details or credentials.
 */
export class PublicProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ nullable: true })
  averageRating: number | null;

  @ApiProperty()
  reviewCount: number;
}
