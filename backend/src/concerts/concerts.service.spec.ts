import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TripStatus } from '../common/enums';
import {
  ProviderConcert,
  TicketmasterService,
} from '../integrations/ticketmaster/ticketmaster.service';
import { Trip } from '../trips/entities/trip.entity';
import { ConcertsService } from './concerts.service';
import { SearchConcertsDto } from './dto/search-concerts.dto';
import { Concert } from './entities/concert.entity';

describe('ConcertsService', () => {
  let service: ConcertsService;
  let concertsRepository: {
    createQueryBuilder: jest.Mock;
    findOneBy: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    upsert: jest.Mock;
  };
  let tripsRepository: { find: jest.Mock };
  let ticketmasterService: { searchEvents: jest.Mock };
  let queryBuilder: {
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
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
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    concertsRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOneBy: jest.fn(),
      create: jest.fn((data: Partial<Concert>) => data),
      save: jest.fn((concert: Concert) => Promise.resolve(concert)),
      upsert: jest.fn(),
    };
    tripsRepository = { find: jest.fn() };
    ticketmasterService = { searchEvents: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConcertsService,
        { provide: getRepositoryToken(Concert), useValue: concertsRepository },
        { provide: getRepositoryToken(Trip), useValue: tripsRepository },
        { provide: TicketmasterService, useValue: ticketmasterService },
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
});
