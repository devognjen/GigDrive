import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Booking } from '../../../core/models/booking.model';
import { MyBookings } from './my-bookings';

const mockBookings: Booking[] = [
  {
    id: 'b1',
    tripId: 't1',
    passengerId: 'p1',
    seats: 2,
    status: 'CONFIRMED',
    paid: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    decidedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'b2',
    tripId: 't2',
    passengerId: 'p1',
    seats: 1,
    status: 'PENDING',
    paid: false,
    createdAt: '2026-08-03T00:00:00.000Z',
    decidedAt: null,
  },
];

describe('MyBookings', () => {
  let component: MyBookings;
  let fixture: ComponentFixture<MyBookings>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyBookings],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MyBookings);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create and load bookings', () => {
    expect(component).toBeTruthy();
    httpTesting.expectOne('/api/bookings/mine').flush(mockBookings);
  });

  it('renders bookings with statuses', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/bookings/mine').flush(mockBookings);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('CONFIRMED');
    expect(text).toContain('PENDING');
    expect(text).toContain('2 seats');
    expect(text).toContain('Not paid');
  });

  it('renders an empty state', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/bookings/mine').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('You have no bookings yet.');
  });

  it('cancels a booking and updates the list', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/bookings/mine').flush(mockBookings);
    fixture.detectChanges();

    const cancelButtons = fixture.nativeElement.querySelectorAll('button.danger');
    cancelButtons[0].click();

    const req = httpTesting.expectOne('/api/bookings/b1/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({ ...mockBookings[0], status: 'CANCELLED_BY_PASSENGER' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('CANCELLED_BY_PASSENGER');
  });
});
