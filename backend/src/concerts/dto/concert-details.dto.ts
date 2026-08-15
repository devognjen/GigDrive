import { ApiProperty } from '@nestjs/swagger';
import { ConcertTripDto } from './concert-trip.dto';
import { ConcertDto } from './concert.dto';

export class ConcertDetailsDto {
  @ApiProperty({ type: ConcertDto })
  concert: ConcertDto;

  @ApiProperty({ type: [ConcertTripDto] })
  trips: ConcertTripDto[];
}
