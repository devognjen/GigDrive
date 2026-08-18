import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Trip } from '../../core/models/trip.model';
import { TripService } from './trip.service';

describe('TripService', () => {
  let service: TripService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TripService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TripService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists trips with a concertId filter', () => {
    service.list({ concertId: 'concert-1' }).subscribe();
    const req = httpMock.expectOne('/api/trips?concertId=concert-1');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('gets a single trip', () => {
    const trip = { id: 't1' } as Trip;
    service.get('t1').subscribe((result) => expect(result).toEqual(trip));
    const req = httpMock.expectOne('/api/trips/t1');
    expect(req.request.method).toBe('GET');
    req.flush(trip);
  });

  it('confirms a trip via POST', () => {
    service.confirm('t1').subscribe();
    const req = httpMock.expectOne('/api/trips/t1/confirm');
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('exports the passenger manifest as a blob', () => {
    service.exportManifest('t1').subscribe();
    const req = httpMock.expectOne('/api/trips/t1/manifest');
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['csv']));
  });
});
