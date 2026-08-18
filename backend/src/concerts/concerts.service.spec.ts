import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TripStatus } from '../common/enums';
import {
  ProviderConcert,
  TicketmasterService,
} from '../integrations/ticketmaster/ticketmaster.service';
import { OpenMeteoService } from '../integrations/open-meteo/open-meteo.service';
import { Trip } from '../trips/entities/trip.entity';
import { ConcertsService, UPCOMING_CONCERTS_LIMIT } from './concerts.service';
import { WeatherUnavailableReason } from './dto/concert-weather.dto';
import { SearchConcertsDto } from './dto/search-concerts.dto';
import { Concert } from './entities/concert.entity';

describe('ConcertsService', () => {
  let service: ConcertsService;
  let concertsRepository: {
    createQueryBuilder: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    upsert: jest.Mock;
  };
  let tripsRepository: { find: jest.Mock };
  let ticketmasterService: { searchEvents: jest.Mock };
  let openMeteoService: { getForecastForDate: jest.Mock };
  let queryBuilder: {
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    select: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    groupBy: jest.Mock;
    getMany: jest.Mock;
    getRawMany: jest.Mock;
  };

  const buildConcert = (overrides: Partial<Concert> = {}): Concert => ({
    id: 'concert-uuid',
    externalId: 'tm-1',
    userSubmitted: false,
    artist: 'Rammstein',
    title: 'Rammstein Live',
    venue: 'Ernst-Happel-Stadion',
    city: 'Vienna',
    country: 'Austria',
    lat: 48.207,
    lng: 16.42,
    startAt: new Date('2026-07-01T19:00:00Z'),
    imageUrl: 'https://img.example/1.jpg',
    genre: 'Metal',
    ticketUrl: 'https://ticketmaster.example/event/tm-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const buildProviderConcert = (
    overrides: Partial<ProviderConcert> = {},
  ): ProviderConcert => ({
    externalId: 'tm-1',
    artist: 'Rammstein',
    title: 'Rammstein Live',
    venue: 'Ernst-Happel-Stadion',
    city: 'Vienna',
    country: 'Austria',
    lat: 48.207,
    lng: 16.42,
    startAt: new Date('2026-07-01T19:00:00Z'),
    imageUrl: 'https://img.example/1.jpg',
    genre: 'Metal',
    ticketUrl: 'https://ticketmaster.example/event/tm-1',
    ...overrides,
  });

  beforeEach(async () => {
    queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getRawMany: jest.fn(),
    };
    concertsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn((data: Partial<Concert>) => data),
      save: jest.fn((concert: Concert) => Promise.resolve(concert)),
      upsert: jest.fn(),
    };
    tripsRepository = { find: jest.fn() };
    ticketmasterService = { searchEvents: jest.fn() };
    openMeteoService = { getForecastForDate: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertsService,
        { provide: getRepositoryToken(Concert), useValue: concertsRepository },
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
        { provide: TicketmasterService, useValue: ticketmasterService },
        { provide: OpenMeteoService, useValue: openMeteoService },
      ],
    }).compile();

    service = module.get<ConcertsService>(ConcertsService);
  });

  describe('search', () => {
    it('serves cached matches without calling the provider (quota-safe)', async () => {
      queryBuilder.getMany.mockResolvedValue([buildConcert()]);

      const result = await service.search(new SearchConcertsDto());

      expect(ticketmasterService.searchEvents).not.toHaveBeenCalled();
      expect(concertsRepository.upsert).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'concert-uuid',
        artist: 'Rammstein',
        externalId: 'tm-1',
      });
    });

    it('upserts provider results into the cache on a cache miss', async () => {
      const dto = new SearchConcertsDto();
      dto.q = 'Rammstein';
      queryBuilder.getMany
        .mockResolvedValueOnce([]) // cache miss
        .mockResolvedValueOnce([buildConcert()]); // re-query after upsert
      ticketmasterService.searchEvents.mockResolvedValue([
        buildProviderConcert(),
      ]);

      const result = await service.search(dto);

      expect(ticketmasterService.searchEvents).toHaveBeenCalledWith(dto);
      expect(concertsRepository.upsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            externalId: 'tm-1',
            userSubmitted: false,
          }),
        ],
        ['externalId'],
      );
      expect(result).toHaveLength(1);
      expect(result[0].externalId).toBe('tm-1');
    });

    it('returns an empty list when the provider is unavailable and the cache is empty', async () => {
      queryBuilder.getMany.mockResolvedValue([]);
      ticketmasterService.searchEvents.mockResolvedValue(null);

      const result = await service.search(new SearchConcertsDto());

      expect(result).toEqual([]);
      expect(concertsRepository.upsert).not.toHaveBeenCalled();
    });

    it('returns an empty list when the provider has no matches', async () => {
      queryBuilder.getMany.mockResolvedValue([]);
      ticketmasterService.searchEvents.mockResolvedValue([]);

      const result = await service.search(new SearchConcertsDto());

      expect(result).toEqual([]);
      expect(concertsRepository.upsert).not.toHaveBeenCalled();
    });

    it('applies all filters to the cache query', async () => {
      const dto = new SearchConcertsDto();
      dto.q = 'Rammstein';
      dto.city = 'Vienna';
      dto.dateFrom = '2026-07-01';
      dto.dateTo = '2026-07-31';
      dto.genre = 'Metal';
      dto.page = 2;
      queryBuilder.getMany.mockResolvedValue([buildConcert()]);

      await service.search(dto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('concert.artist'),
        { q: '%rammstein%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('concert.city'),
        { city: '%vienna%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'concert.startAt >= :dateFrom',
        { dateFrom: '2026-07-01T00:00:00Z' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'concert.startAt <= :dateTo',
        { dateTo: '2026-07-31T23:59:59.999Z' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('concert.genre'),
        { genre: '%metal%' },
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(40);
      expect(queryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  describe('listUpcoming', () => {
    it('returns cached concerts from now onward, oldest first', async () => {
      concertsRepository.find.mockResolvedValue([buildConcert()]);

      const result = await service.listUpcoming();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('concert-uuid');
      expect(concertsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { startAt: 'ASC' },
          take: UPCOMING_CONCERTS_LIMIT,
        }),
      );
      const where = concertsRepository.find.mock.calls[0][0].where as {
        startAt: { type: string };
      };
      expect(where.startAt.type).toBe('moreThanOrEqual');
    });
  });

  describe('getFilterOptions', () => {
    it('returns distinct cities and genres from the cache', async () => {
      queryBuilder.getRawMany
        .mockResolvedValueOnce([{ value: 'Vienna' }, { value: 'Zagreb' }])
        .mockResolvedValueOnce([{ value: 'Metal' }, { value: 'Rock' }]);

      const result = await service.getFilterOptions();

      expect(result).toEqual({
        cities: ['Vienna', 'Zagreb'],
        genres: ['Metal', 'Rock'],
      });
      expect(queryBuilder.select).toHaveBeenCalledWith(
        'MIN(concert.city)',
        'value',
      );
      expect(queryBuilder.select).toHaveBeenCalledWith(
        'MIN(concert.genre)',
        'value',
      );
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('LOWER(concert.city)');
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('LOWER(concert.genre)');
    });

    it('omits empty and missing values', async () => {
      queryBuilder.getRawMany
        .mockResolvedValueOnce([{ value: 'Vienna' }, { value: '' }])
        .mockResolvedValueOnce([{ value: null }, { value: 'Metal' }]);

      const result = await service.getFilterOptions();

      expect(result).toEqual({
        cities: ['Vienna'],
        genres: ['Metal'],
      });
    });

    it('returns empty lists when the cache has no values', async () => {
      queryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getFilterOptions();

      expect(result).toEqual({ cities: [], genres: [] });
    });
  });

  describe('getDetails', () => {
    it('returns the concert with its linked trips', async () => {
      concertsRepository.findOneBy.mockResolvedValue(buildConcert());
      const trip = {
        id: 'trip-uuid',
        status: TripStatus.Open,
        departureAt: new Date('2026-07-01T12:00:00Z'),
        minPassengers: 2,
        maxPassengers: 4,
        driverId: 'driver-uuid',
        driver: { firstName: 'Ada', lastName: 'Lovelace' },
      } as Trip;
      tripsRepository.find.mockResolvedValue([trip]);

      const details = await service.getDetails('concert-uuid');

      expect(details.concert.id).toBe('concert-uuid');
      expect(details.trips).toEqual([
        {
          id: 'trip-uuid',
          status: TripStatus.Open,
          departureAt: new Date('2026-07-01T12:00:00Z'),
          minPassengers: 2,
          maxPassengers: 4,
          driverId: 'driver-uuid',
          driverName: 'Ada Lovelace',
        },
      ]);
      expect(tripsRepository.find).toHaveBeenCalledWith({
        where: { concertId: 'concert-uuid' },
        relations: { driver: true },
        order: { departureAt: 'ASC' },
      });
    });

    it('throws NotFoundException for an unknown concert', async () => {
      concertsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getDetails('missing')).rejects.toThrow(
        new NotFoundException('Concert not found'),
      );
    });
  });

  describe('create', () => {
    it('persists a user-submitted concert without an external id', async () => {
      const dto = {
        artist: 'Bajaga',
        title: 'Bajaga i Instruktori Live',
        venue: 'Kalemegdan',
        city: 'Belgrade',
        country: 'Serbia',
        startAt: '2026-08-20T20:00:00.000Z',
      };

      const result = await service.create(dto);

      expect(concertsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          externalId: null,
          userSubmitted: true,
          artist: 'Bajaga',
          startAt: new Date('2026-08-20T20:00:00.000Z'),
        }),
      );
      expect(concertsRepository.save).toHaveBeenCalled();
      expect(result.userSubmitted).toBe(true);
      expect(result.externalId).toBeNull();
    });
  });

  describe('getWeather', () => {
    it('maps an Open-Meteo forecast for the concert day', async () => {
      concertsRepository.findOneBy.mockResolvedValue(buildConcert());
      openMeteoService.getForecastForDate.mockResolvedValue({
        status: 'ok',
        forecast: {
          date: '2026-07-01',
          weatherCode: 61,
          description: 'Rain',
          tempMinC: 14,
          tempMaxC: 22,
          precipitationMm: 4.2,
        },
      });

      const result = await service.getWeather('concert-uuid');

      expect(openMeteoService.getForecastForDate).toHaveBeenCalledWith(
        48.207,
        16.42,
        new Date('2026-07-01T19:00:00Z'),
      );
      expect(result).toMatchObject({
        available: true,
        date: '2026-07-01',
        description: 'Rain',
        tempMinC: 14,
        tempMaxC: 22,
        precipitationMm: 4.2,
      });
    });

    it('returns NO_COORDINATES without calling Open-Meteo', async () => {
      concertsRepository.findOneBy.mockResolvedValue(
        buildConcert({ lat: null, lng: null }),
      );

      const result = await service.getWeather('concert-uuid');

      expect(result).toEqual({
        available: false,
        reason: WeatherUnavailableReason.NoCoordinates,
      });
      expect(openMeteoService.getForecastForDate).not.toHaveBeenCalled();
    });

    it('returns OUT_OF_RANGE when the concert day is not forecastable', async () => {
      concertsRepository.findOneBy.mockResolvedValue(buildConcert());
      openMeteoService.getForecastForDate.mockResolvedValue({
        status: 'out_of_range',
      });

      const result = await service.getWeather('concert-uuid');

      expect(result).toEqual({
        available: false,
        reason: WeatherUnavailableReason.OutOfRange,
      });
    });

    it('returns UNAVAILABLE when the provider fails', async () => {
      concertsRepository.findOneBy.mockResolvedValue(buildConcert());
      openMeteoService.getForecastForDate.mockResolvedValue({
        status: 'unavailable',
      });

      const result = await service.getWeather('concert-uuid');

      expect(result).toEqual({
        available: false,
        reason: WeatherUnavailableReason.Unavailable,
      });
    });

    it('throws NotFoundException for an unknown concert', async () => {
      concertsRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getWeather('missing')).rejects.toThrow(
        new NotFoundException('Concert not found'),
      );
    });
  });
});
