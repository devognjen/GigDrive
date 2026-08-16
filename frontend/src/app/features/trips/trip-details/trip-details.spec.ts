import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { Trip } from '../../../core/models/trip.model';
import { TripDetails } from './trip-details';

const mockTrip: Trip = {
  id: 't1',
  driverId: 'd1',
  driverName: 'Demo Driver',
  driverAverageRating: 4.5,
  vehicleId: 'v1',
  vehicleType: 'VAN',
  concertId: 'c1',
  pricingMode: 'SHARED_TOTAL',
  totalCost: 12000,
  currency: 'EUR',
  minPassengers: 4,
  maxPassengers: 8,
  confirmationDeadline: '2026-09-01T00:00:00.000Z',
  departureAt: '2026-09-10T00:00:00.000Z',
  roundTrip: true,
  notes: 'Leaving late',
  status: 'OPEN',
  confirmedSeats: 3,
  seatsLeft: 5,
  stops: [{ id: 's1', seq: 1, place: 'Novi Sad', lat: null, lng: null, plannedTime: null }],
  livePrice: { perPerson: 3000, lowerBound: 3000, upperBound: 1500 },
};

describe('TripDetails', () => {
  let component: TripDetails;
  let fixture: ComponentFixture<TripDetails>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripDetails],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 't1' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripDetails);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    httpTesting.expectOne('/api/trips/t1').flush(mockTrip);
  });

  it('renders the trip with price band and stops', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/trips/t1').flush(mockTrip);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Demo Driver');
    expect(text).toContain('30.00 €');
    expect(text).toContain('Novi Sad');
    expect(text).toContain('3/8 seats filled');
  });
});
