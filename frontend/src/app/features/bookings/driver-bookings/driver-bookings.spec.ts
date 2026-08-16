import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Booking } from '../../../core/models/booking.model';
import { DriverBookings } from './driver-bookings';

const mockBookings: Booking[] = [
  {
    id: 'b1',
    tripId: 't1',
    passengerId: 'p1',
    seats: 2,
    status: 'PENDING',
    paid: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    decidedAt: null,
  },
  {
    id: 'b2',
    tripId: 't1',
    passengerId: 'p2',
    seats: 1,
    status: 'CONFIRMED',
    paid: false,
    createdAt: '2026-08-02T00:00:00.000Z',
    decidedAt: '2026-08-03T00:00:00.000Z',
  },
];

describe('DriverBookings', () => {
  let component: DriverBookings;
  let fixture: ComponentFixture<DriverBookings>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverBookings],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverBookings);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create and load bookings', () => {
    expect(component).toBeTruthy();
    httpTesting.expectOne('/api/bookings').flush(mockBookings);
  });

  it('renders pending and confirmed bookings', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/bookings').flush(mockBookings);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('PENDING');
    expect(text).toContain('CONFIRMED');
    expect(text).toContain('Accept');
    expect(text).toContain('Reject');
    expect(text).toContain('Mark paid');
  });

  it('accepts a pending booking', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/bookings').flush(mockBookings);
    fixture.detectChanges();

    const acceptButton = fixture.nativeElement.querySelector('button.accept');
    acceptButton.click();

    const req = httpTesting.expectOne('/api/bookings/b1/accept');
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockBookings[0], status: 'CONFIRMED' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('CONFIRMED');
  });

  it('renders an empty state', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/bookings').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No booking requests yet.');
  });
});
