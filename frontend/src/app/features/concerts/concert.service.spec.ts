import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Concert, ConcertDetails } from '../../core/models/concert.model';
import { ConcertService } from './concert.service';

const mockConcert: Concert = {
  id: 'c1',
  externalId: null,
  userSubmitted: true,
  artist: 'Metallica',
  title: 'M72 World Tour',
  venue: 'Stade de France',
  city: 'Paris',
  country: 'France',
  lat: null,
  lng: null,
  startAt: '2026-09-01T18:00:00.000Z',
  imageUrl: null,
  genre: 'Metal',
  ticketUrl: null,
};

const mockDetails: ConcertDetails = {
  concert: mockConcert,
  trips: [
    {
      id: 't1',
      status: 'OPEN',
      departureAt: '2026-09-01T14:00:00.000Z',
      minPassengers: 2,
      maxPassengers: 4,
      driverId: 'u1',
      driverName: 'Ada',
    },
  ],
};

describe('ConcertService', () => {
  let service: ConcertService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConcertService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('search', () => {
    it('requests the search endpoint without params by default', () => {
      service.search().subscribe();

      const req = httpTesting.expectOne('/api/concerts/search');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([]);
    });

    it('builds the query string from the given params', () => {
      service
        .search({
          q: 'metal',
          city: 'Paris',
          dateFrom: '2026-09-01',
          dateTo: '2026-09-30',
          genre: 'Metal',
          page: 2,
        })
        .subscribe();

      const req = httpTesting.expectOne((r) => r.url === '/api/concerts/search');
      expect(req.request.params.get('q')).toBe('metal');
      expect(req.request.params.get('city')).toBe('Paris');
      expect(req.request.params.get('dateFrom')).toBe('2026-09-01');
      expect(req.request.params.get('dateTo')).toBe('2026-09-30');
      expect(req.request.params.get('genre')).toBe('Metal');
      expect(req.request.params.get('page')).toBe('2');
      req.flush([]);
    });

    it('skips empty params', () => {
      service.search({ q: '', city: 'Paris', genre: '', page: 0 }).subscribe();

      const req = httpTesting.expectOne((r) => r.url === '/api/concerts/search');
      expect(req.request.params.has('q')).toBe(false);
      expect(req.request.params.has('genre')).toBe(false);
      expect(req.request.params.get('city')).toBe('Paris');
      expect(req.request.params.get('page')).toBe('0');
      req.flush([]);
    });

    it('returns the concerts from the response', () => {
      let result: Concert[] | undefined;
      service.search({ q: 'metal' }).subscribe((concerts) => (result = concerts));

      httpTesting.expectOne((r) => r.url === '/api/concerts/search').flush([mockConcert]);

      expect(result).toEqual([mockConcert]);
    });
  });

  describe('getDetails', () => {
    it('requests the concert details endpoint', () => {
      let result: ConcertDetails | undefined;
      service.getDetails('c1').subscribe((details) => (result = details));

      const req = httpTesting.expectOne('/api/concerts/c1');
      expect(req.request.method).toBe('GET');
      req.flush(mockDetails);

      expect(result).toEqual(mockDetails);
    });
  });

  describe('create', () => {
    it('posts the request body to the concerts endpoint', () => {
      const payload = {
        artist: 'Metallica',
        title: 'M72 World Tour',
        venue: 'Stade de France',
        city: 'Paris',
        country: 'France',
        startAt: '2026-09-01T18:00:00.000Z',
        genre: 'Metal',
      };

      let result: Concert | undefined;
      service.create(payload).subscribe((concert) => (result = concert));

      const req = httpTesting.expectOne('/api/concerts');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockConcert);

      expect(result).toEqual(mockConcert);
    });
  });
});
