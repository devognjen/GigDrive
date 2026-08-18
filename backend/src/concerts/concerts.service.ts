import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenMeteoService } from '../integrations/open-meteo/open-meteo.service';
import {
  ProviderConcert,
  TicketmasterService,
} from '../integrations/ticketmaster/ticketmaster.service';
import { Trip } from '../trips/entities/trip.entity';
import { ConcertDetailsDto } from './dto/concert-details.dto';
import { ConcertFilterOptionsDto } from './dto/concert-filter-options.dto';
import { ConcertTripDto } from './dto/concert-trip.dto';
import {
  ConcertWeatherDto,
  WeatherUnavailableReason,
} from './dto/concert-weather.dto';
import { ConcertDto } from './dto/concert.dto';
import { CreateConcertDto } from './dto/create-concert.dto';
import { SearchConcertsDto } from './dto/search-concerts.dto';
import { Concert } from './entities/concert.entity';

export const CONCERTS_PAGE_SIZE = 20;

@Injectable()
export class ConcertsService {
  private readonly logger = new Logger(ConcertsService.name);

  constructor(
    @InjectRepository(Concert)
    private readonly concertsRepository: Repository<Concert>,
    @InjectRepository(Trip)
    private readonly tripsRepository: Repository<Trip>,
    private readonly ticketmasterService: TicketmasterService,
    private readonly openMeteoService: OpenMeteoService,
  ) {}

  /**
   * Cache-first search (quota-safe, PRD §4.3): the local cache is the source
   * of truth, so repeated searches never touch the provider. The provider is
   * only queried on a cache miss and its results are upserted, after which
   * the cache is re-queried so responses always come from local rows.
   * When the provider is unavailable the (possibly empty) cache result is
   * served — search keeps working during outages and quota exhaustion.
   */
  async search(dto: SearchConcertsDto): Promise<ConcertDto[]> {
    const cached = await this.searchCache(dto);
    if (cached.length > 0) {
      return cached.map((concert) => ConcertDto.fromEntity(concert));
    }

    const fetched = await this.ticketmasterService.searchEvents(dto);
    if (fetched === null) {
      this.logger.warn(
        'Concert provider unavailable; serving cached results only',
      );
      return [];
    }
    if (fetched.length === 0) {
      return [];
    }

    await this.upsertProviderConcerts(fetched);
    const cachedAfterSync = await this.searchCache(dto);
    return cachedAfterSync.map((concert) => ConcertDto.fromEntity(concert));
  }

  /**
   * Distinct cities and genres in the cache, for search dropdowns.
   * Values are grouped case-insensitively so "Vienna" and "vienna" collapse
   * to a single option; empty and null genres are omitted.
   */
  async getFilterOptions(): Promise<ConcertFilterOptionsDto> {
    const [cities, genres] = await Promise.all([
      this.distinctColumn('city'),
      this.distinctColumn('genre'),
    ]);
    return ConcertFilterOptionsDto.from(cities, genres);
  }

  async getDetails(id: string): Promise<ConcertDetailsDto> {
    const concert = await this.concertsRepository.findOneBy({ id });
    if (!concert) {
      throw new NotFoundException('Concert not found');
    }
    const trips = await this.tripsRepository.find({
      where: { concertId: id },
      relations: { driver: true },
      order: { departureAt: 'ASC' },
    });
    const dto = new ConcertDetailsDto();
    dto.concert = ConcertDto.fromEntity(concert);
    dto.trips = trips.map((trip) => ConcertTripDto.fromEntity(trip));
    return dto;
  }

  /**
   * Concert-day forecast via the Open-Meteo proxy. Missing coordinates and
   * dates outside the forecast window are empty states; provider failures
   * are reported as unavailable so the widget can hide without 5xx.
   */
  async getWeather(id: string): Promise<ConcertWeatherDto> {
    const concert = await this.concertsRepository.findOneBy({ id });
    if (!concert) {
      throw new NotFoundException('Concert not found');
    }
    if (!hasCoordinates(concert)) {
      return ConcertWeatherDto.unavailable(
        WeatherUnavailableReason.NoCoordinates,
      );
    }
    const result = await this.openMeteoService.getForecastForDate(
      concert.lat,
      concert.lng,
      concert.startAt,
    );
    if (result.status === 'ok') {
      return ConcertWeatherDto.fromForecast(result.forecast);
    }
    if (result.status === 'out_of_range') {
      return ConcertWeatherDto.unavailable(WeatherUnavailableReason.OutOfRange);
    }
    return ConcertWeatherDto.unavailable(WeatherUnavailableReason.Unavailable);
  }

  /** Manual creation (FR-CON-04): no provider id, flagged userSubmitted. */
  async create(dto: CreateConcertDto): Promise<ConcertDto> {
    const concert = this.concertsRepository.create({
      ...dto,
      lat: dto.lat ?? null,
      lng: dto.lng ?? null,
      imageUrl: dto.imageUrl ?? null,
      genre: dto.genre ?? null,
      ticketUrl: dto.ticketUrl ?? null,
      startAt: new Date(dto.startAt),
      externalId: null,
      userSubmitted: true,
    });
    return ConcertDto.fromEntity(await this.concertsRepository.save(concert));
  }

  private searchCache(dto: SearchConcertsDto): Promise<Concert[]> {
    const qb = this.concertsRepository
      .createQueryBuilder('concert')
      .orderBy('concert.startAt', 'ASC')
      .skip(dto.page * CONCERTS_PAGE_SIZE)
      .take(CONCERTS_PAGE_SIZE);
    if (dto.q) {
      qb.andWhere(
        '(LOWER(concert.artist) LIKE :q OR LOWER(concert.title) LIKE :q)',
        { q: `%${dto.q.toLowerCase()}%` },
      );
    }
    if (dto.city) {
      qb.andWhere('LOWER(concert.city) LIKE :city', {
        city: `%${dto.city.toLowerCase()}%`,
      });
    }
    if (dto.dateFrom) {
      qb.andWhere('concert.startAt >= :dateFrom', {
        dateFrom: `${dto.dateFrom}T00:00:00Z`,
      });
    }
    if (dto.dateTo) {
      qb.andWhere('concert.startAt <= :dateTo', {
        dateTo: `${dto.dateTo}T23:59:59.999Z`,
      });
    }
    if (dto.genre) {
      qb.andWhere('LOWER(concert.genre) LIKE :genre', {
        genre: `%${dto.genre.toLowerCase()}%`,
      });
    }
    return qb.getMany();
  }

  private async distinctColumn(
    column: 'city' | 'genre',
  ): Promise<string[]> {
    const rows = await this.concertsRepository
      .createQueryBuilder('concert')
      .select(`MIN(concert.${column})`, 'value')
      .where(`concert.${column} IS NOT NULL`)
      .andWhere(`concert.${column} <> ''`)
      .groupBy(`LOWER(concert.${column})`)
      .orderBy(`MIN(concert.${column})`, 'ASC')
      .getRawMany<{ value: string }>();
    return rows
      .map((row) => row.value)
      .filter((value): value is string => Boolean(value));
  }

  /** Upserts provider results into the cache (unique externalId, FR-CON-02). */
  private async upsertProviderConcerts(
    concerts: ProviderConcert[],
  ): Promise<void> {
    await this.concertsRepository.upsert(
      concerts.map((concert) => ({ ...concert, userSubmitted: false })),
      ['externalId'],
    );
  }
}

function hasCoordinates(
  concert: Concert,
): concert is Concert & { lat: number; lng: number } {
  return (
    concert.lat !== null &&
    concert.lng !== null &&
    Number.isFinite(concert.lat) &&
    Number.isFinite(concert.lng)
  );
}
