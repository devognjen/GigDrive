import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';

import { User } from '../../../core/models/user.model';
import { Trip } from '../../../core/models/trip.model';
import { AuthService } from '../../../core/services/auth.service';
import { buildBooking } from '../../../testing/trip.fixture';
import { ChatService } from '../../chat/chat.service';
import { TripDetails } from './trip-details';

const mockTrip: Trip = {
  id: 't1',
  driverId: 'd1',
  driverName: 'Demo Driver',
  driverAverageRating: 4.5,
  driverReviewCount: 2,
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
  roundTrip: true,
  notes: 'Leaving late',
  status: 'OPEN',
  confirmedSeats: 3,
  seatsLeft: 5,
  stops: [{ id: 's1', seq: 1, place: 'Novi Sad', lat: null, lng: null, plannedTime: null }],
  livePrice: { perPerson: 3000, lowerBound: 3000, upperBound: 1500 },
};

const driver: User = {
  id: 'd1',
  email: 'driver@gigdrive.demo',
  firstName: 'Demo',
  lastName: 'Driver',
  phone: null,
  emailNotifications: true,
};

const passenger: User = {
  id: 'p1',
  email: 'ana@gigdrive.demo',
  firstName: 'Ana',
  lastName: 'Passenger',
  phone: null,
  emailNotifications: true,
};

describe('TripDetails', () => {
  let component: TripDetails;
  let fixture: ComponentFixture<TripDetails>;
  let httpTesting: HttpTestingController;
  const currentUser = signal<User | null>(null);

  beforeEach(async () => {
    currentUser.set(null);
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
        {
          provide: AuthService,
          useValue: {
            currentUser: currentUser.asReadonly(),
            getToken: () => (currentUser() ? 'jwt' : null),
          },
        },
        {
          provide: ChatService,
          useValue: {
            getMessages: () => of([]),
            connect: () => EMPTY,
            send: vi.fn(),
            disconnect: vi.fn(),
          },
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

  function flushPage(chat = false): void {
    httpTesting.expectOne('/api/features').flush({ chat });
    httpTesting.expectOne('/api/trips/t1').flush(mockTrip);
  }

  it('should create', () => {
    expect(component).toBeTruthy();
    flushPage();
  });

  it('renders the trip with price band and stops', () => {
    fixture.detectChanges();
    flushPage();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Demo Driver');
    expect(text).toContain('30.00 €');
    expect(text).toContain('Novi Sad');
    expect(text).toContain('3/8 seats filled');
    expect(text).toContain('4.5 (2 reviews)');
    const driverLink = fixture.nativeElement.querySelector('a[href="/users/d1"]') as HTMLAnchorElement | null;
    expect(driverLink?.textContent).toContain('Demo Driver');
    expect(text).not.toContain('Trip chat');
  });

  it('keeps the stop list and omits the map when stops have no coordinates', () => {
    fixture.detectChanges();
    flushPage();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Novi Sad');
    expect(fixture.nativeElement.querySelector('.pickup-map-canvas')).toBeNull();
  });

  it('shows the map when a stop has coordinates', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/features').flush({ chat: false });
    httpTesting.expectOne('/api/trips/t1').flush({
      ...mockTrip,
      stops: [{ id: 's1', seq: 1, place: 'Novi Sad', lat: 45.2649, lng: 19.8296, plannedTime: null }],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Novi Sad');
    expect(fixture.nativeElement.querySelector('.pickup-map-canvas')).not.toBeNull();
  });

  it('hides chat when the feature flag is off', () => {
    currentUser.set(driver);
    fixture.detectChanges();
    flushPage(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Trip chat');
  });

  it('shows chat for the driver when the flag is on', () => {
    currentUser.set(driver);
    fixture.detectChanges();
    flushPage(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Trip chat');
  });

  it('shows chat for a confirmed passenger when the flag is on', () => {
    currentUser.set(passenger);
    fixture.detectChanges();
    flushPage(true);
    httpTesting.expectOne('/api/bookings/mine').flush([
      buildBooking({ tripId: 't1', passengerId: 'p1', status: 'CONFIRMED' }),
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Trip chat');
  });

  it('hides chat for a non-member when the flag is on', () => {
    currentUser.set(passenger);
    fixture.detectChanges();
    flushPage(true);
    httpTesting.expectOne('/api/bookings/mine').flush([
      buildBooking({ tripId: 't1', passengerId: 'p1', status: 'PENDING' }),
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Trip chat');
  });

  it('shows the booking form on OPEN trips for a passenger', () => {
    currentUser.set(passenger);
    fixture.detectChanges();
    flushPage();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Request seats');
    expect(text).not.toContain('Join waitlist');
  });

  it('replaces the booking form with join waitlist on FULL trips', () => {
    currentUser.set(passenger);
    fixture.detectChanges();
    httpTesting.expectOne('/api/features').flush({ chat: false });
    httpTesting.expectOne('/api/trips/t1').flush({
      ...mockTrip,
      status: 'FULL',
      confirmedSeats: 8,
      seatsLeft: 0,
    });
    httpTesting.expectOne('/api/waitlist/mine').flush([]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Join waitlist');
    expect(text).not.toContain('Request seats');
  });

  it('shows Export CSV for the driver when the trip has confirmed seats', () => {
    currentUser.set(driver);
    fixture.detectChanges();
    flushPage();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Export CSV');
  });

  it('hides Export CSV for a passenger', () => {
    currentUser.set(passenger);
    fixture.detectChanges();
    flushPage();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Export CSV');
  });

  it('hides Export CSV when the driver has no confirmed passengers', () => {
    currentUser.set(driver);
    fixture.detectChanges();
    httpTesting.expectOne('/api/features').flush({ chat: false });
    httpTesting.expectOne('/api/trips/t1').flush({ ...mockTrip, confirmedSeats: 0, seatsLeft: 8 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Export CSV');
  });
});
