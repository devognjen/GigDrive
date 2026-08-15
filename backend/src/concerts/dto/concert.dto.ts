import { ApiProperty } from '@nestjs/swagger';
import { Concert } from '../entities/concert.entity';

/** API representation of a cached concert. */
export class ConcertDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  externalId: string | null;

  @ApiProperty()
  userSubmitted: boolean;

  @ApiProperty()
  artist: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  venue: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;

  @ApiProperty({ nullable: true })
  lat: number | null;

  @ApiProperty({ nullable: true })
  lng: number | null;

  @ApiProperty()
  startAt: Date;

  @ApiProperty({ nullable: true })
  imageUrl: string | null;

  @ApiProperty({ nullable: true })
  genre: string | null;

  @ApiProperty({ nullable: true })
  ticketUrl: string | null;

  static fromEntity(concert: Concert): ConcertDto {
    const dto = new ConcertDto();
    dto.id = concert.id;
    dto.externalId = concert.externalId;
    dto.userSubmitted = concert.userSubmitted;
    dto.artist = concert.artist;
    dto.title = concert.title;
    dto.venue = concert.venue;
    dto.city = concert.city;
    dto.country = concert.country;
    dto.lat = concert.lat;
    dto.lng = concert.lng;
    dto.startAt = concert.startAt;
    dto.imageUrl = concert.imageUrl;
    dto.genre = concert.genre;
    dto.ticketUrl = concert.ticketUrl;
    return dto;
  }
}
