import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { WaitlistEntry } from '../../core/models/waitlist.model';
import { buildTrip } from '../../testing/trip.fixture';
import { WaitlistService } from './waitlist.service';

describe('WaitlistService', () => {
  let service: WaitlistService;
  let httpMock: HttpTestingController;

  const entry: WaitlistEntry = {
    id: 'w1',
    tripId: 't1',
    passengerId: 'p1',
    seats: 2,
    position: 1,
    createdAt: '2026-08-01T00:00:00.000Z',
    trip: buildTrip({ status: 'FULL', confirmedSeats: 8, seatsLeft: 0 }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WaitlistService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WaitlistService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('joins the waitlist of a trip', () => {
    service.join('t1', { seats: 2 }).subscribe();
    const req = httpMock.expectOne('/api/trips/t1/waitlist');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ seats: 2 });
    req.flush(entry);
  });

  it('leaves the waitlist of a trip', () => {
    service.leave('t1').subscribe();
    const req = httpMock.expectOne('/api/trips/t1/waitlist');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('lists own waitlist entries', () => {
    service.listMine().subscribe();
    const req = httpMock.expectOne('/api/waitlist/mine');
    expect(req.request.method).toBe('GET');
    req.flush([entry]);
  });
});
