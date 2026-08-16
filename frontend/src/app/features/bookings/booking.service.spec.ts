import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Booking } from '../../core/models/booking.model';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests seats on a trip', () => {
    service.request('t1', { seats: 2 }).subscribe();
    const req = httpMock.expectOne('/api/trips/t1/bookings');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ seats: 2 });
    req.flush({} as Booking);
  });

  it('lists the passenger bookings', () => {
    service.listMine().subscribe();
    const req = httpMock.expectOne('/api/bookings/mine');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('lists the driver bookings', () => {
    service.listForDriver().subscribe();
    const req = httpMock.expectOne('/api/bookings');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('accepts a booking', () => {
    service.accept('b1').subscribe();
    const req = httpMock.expectOne('/api/bookings/b1/accept');
    expect(req.request.method).toBe('POST');
    req.flush({} as Booking);
  });

  it('rejects a booking', () => {
    service.reject('b1').subscribe();
    const req = httpMock.expectOne('/api/bookings/b1/reject');
    expect(req.request.method).toBe('POST');
    req.flush({} as Booking);
  });

  it('cancels a booking', () => {
    service.cancel('b1').subscribe();
    const req = httpMock.expectOne('/api/bookings/b1/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({} as Booking);
  });

  it('sets the paid flag', () => {
    service.setPaid('b1', true).subscribe();
    const req = httpMock.expectOne('/api/bookings/b1/paid');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ paid: true });
    req.flush({} as Booking);
  });
});
