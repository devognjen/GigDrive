import { ApiProperty } from '@nestjs/swagger';

/** Distinct city/genre values currently present in the concert cache. */
export class ConcertFilterOptionsDto {
  @ApiProperty({ type: [String] })
  cities: string[];

  @ApiProperty({ type: [String] })
  genres: string[];

  static from(
    cities: string[],
    genres: string[],
  ): ConcertFilterOptionsDto {
    const dto = new ConcertFilterOptionsDto();
    dto.cities = cities;
    dto.genres = genres;
    return dto;
  }
}
