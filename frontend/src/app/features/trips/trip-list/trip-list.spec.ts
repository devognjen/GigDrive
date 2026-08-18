import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Trip } from '../../../core/models/trip.model';
import { TripList } from './trip-list';

const mockTrips: Trip[] = [
  {
    id: 't1',
    driverId: 'd1',
    driverName: 'Demo Driver',
    driverAverageRating: null,
    driverReviewCount: 0,
    vehicleId: 'v1',
    vehicleType: 'VAN',
    concertId: 'c1',
    concertArtist: 'The Demo Band',
    concertTitle: 'Summer Open Air',
    concertCity: 'Novi Sad',
    concertImageUrl: null,
    pricingMode: 'SHARED_TOTAL',
    totalCost: 12000,
    currency: 'EUR',
    minPassengers: 4,
    maxPassengers: 8,
    confirmationDeadline: '2026-09-01T00:00:00.000Z',
    departureAt: '2026-09-10T00:00:00.000Z',
    roundTrip: false,
    notes: null,
    status: 'OPEN',
    confirmedSeats: 0,
    seatsLeft: 8,
    stops: [],
    livePrice: { perPerson: 3000, lowerBound: 3000, upperBound: 1500 },
  },
];

describe('TripList', () => {
  let component: TripList;
  let fixture: ComponentFixture<TripList>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [TripList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TripList);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    httpTesting.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    vi.advanceTimersByTime(300);
    const req = httpTesting.expectOne((r) => r.url === '/api/trips');
    expect(req.request.params.get('sort')).toBe('soonest');
    req.flush([]);
  });

  it('renders trips with their live price', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/trips').flush(mockTrips);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Demo Driver');
    expect(text).toContain('30.00 €');
  });

  it('passes a concert filter through to the offer-a-ride link', () => {
    vi.advanceTimersByTime(300);
    httpTesting.expectOne((r) => r.url === '/api/trips').flush([]);

    component['concertId'].set('c1');
    fixture.detectChanges();
    httpTesting.match((r) => r.url === '/api/trips').forEach((req) => req.flush([]));

    const link = fixture.nativeElement.querySelector('.new-trip') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/trips/new?concertId=c1');
  });
});
