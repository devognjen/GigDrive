import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { Vehicle } from '../../../core/models/vehicle.model';
import { buildConcert } from '../../../testing/concert.fixture';
import { buildTrip } from '../../../testing/trip.fixture';
import { toLocalInput } from '../../../core/utils/local-datetime';
import { TripCreate } from './trip-create';
import { suggestSchedule } from './trip-schedule';

const vehicle: Vehicle = {
  id: 'v1',
  ownerId: 'd1',
  type: 'VAN',
  make: 'VW',
  model: 'Transporter',
  seats: 8,
  notes: null,
};

const concert = buildConcert();

describe('TripCreate', () => {
  let component: TripCreate;
  let fixture: ComponentFixture<TripCreate>;
  let httpTesting: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [TripCreate],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TripCreate);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    httpTesting.verify();
  });

  function showForm(): void {
    fixture.detectChanges();
    httpTesting.expectOne('/api/vehicles').flush([vehicle]);
    fixture.detectChanges();
    vi.advanceTimersByTime(300);
    httpTesting.expectOne('/api/concerts/upcoming').flush([concert]);
    fixture.detectChanges();
  }

  function fillValidForm(): void {
    component['form'].patchValue({
      vehicleId: vehicle.id,
      concertId: concert.id,
      pricingMode: 'SHARED_TOTAL',
      totalCost: 12000,
      currency: 'EUR',
      minPassengers: 4,
      maxPassengers: 8,
      confirmationDeadline: '2026-08-31T12:00',
      departureAt: '2026-09-01T14:00',
    });
    component['onConcertChange'](concert);
    component['addStop']();
    component['placeControl'](0).setValue('Novi Sad');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
    httpTesting.expectOne('/api/vehicles').flush([]);
  });

  it('shows a prompt when the driver has no vehicle', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/vehicles').flush([]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('You need a vehicle');
  });

  it('omits stop coordinates when they are left empty', () => {
    showForm();
    fillValidForm();
    component['submit']();

    const req = httpTesting.expectOne('/api/trips');
    expect(req.request.body.stops).toEqual([{ seq: 1, place: 'Novi Sad' }]);
    req.flush(buildTrip({ id: 't-new' }));
    expect(navigateSpy).toHaveBeenCalledWith(['/trips', 't-new']);
  });

  it('includes optional stop coordinates when given', () => {
    showForm();
    fillValidForm();
    component['latControl'](0).setValue(45.2649);
    component['lngControl'](0).setValue(19.8296);
    component['submit']();

    const req = httpTesting.expectOne('/api/trips');
    expect(req.request.body.stops).toEqual([
      { seq: 1, place: 'Novi Sad', lat: 45.2649, lng: 19.8296 },
    ]);
    req.flush(buildTrip({ id: 't-new' }));
  });

  it('replaces the concert UUID field with a searchable picker', () => {
    showForm();

    expect(fixture.nativeElement.querySelector('#concertId')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Metallica');
    expect(fixture.nativeElement.querySelector('a[href="/concerts/new"]')).toBeTruthy();
  });

  it('prefills deadline and departure when a concert is chosen and dates are empty', () => {
    showForm();
    component['onConcertChange'](concert);

    const suggested = suggestSchedule(concert.startAt);
    expect(component['form'].controls.confirmationDeadline.value).toBe(
      suggested?.confirmationDeadline,
    );
    expect(component['form'].controls.departureAt.value).toBe(suggested?.departureAt);
  });

  it('does not overwrite dates that the driver already entered', () => {
    showForm();
    component['form'].patchValue({
      confirmationDeadline: '2026-08-20T10:00',
      departureAt: '2026-08-25T10:00',
    });
    component['onConcertChange'](concert);

    expect(component['form'].controls.confirmationDeadline.value).toBe('2026-08-20T10:00');
    expect(component['form'].controls.departureAt.value).toBe('2026-08-25T10:00');
  });

  it('rejects a departure on or before the confirmation deadline', () => {
    showForm();
    fillValidForm();
    component['form'].patchValue({
      confirmationDeadline: '2026-09-01T14:00',
      departureAt: '2026-09-01T14:00',
    });
    fixture.detectChanges();

    expect(component['form'].invalid).toBe(true);
    expect(component['form'].hasError('deadlineAfterDeparture')).toBe(true);
    component['form'].controls.departureAt.markAsTouched();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Departure must be after the confirmation deadline',
    );
  });

  it('caps the departure picker at the concert start', () => {
    showForm();
    component['onConcertChange'](concert);
    fixture.detectChanges();

    const departure = fixture.nativeElement.querySelector('#departureAt') as HTMLInputElement;
    expect(departure.getAttribute('max')).toBe(toLocalInput(concert.startAt));
  });
});

describe('TripCreate query prefill', () => {
  let fixture: ComponentFixture<TripCreate>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [TripCreate],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({}),
              queryParamMap: convertToParamMap({ concertId: 'c1' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TripCreate);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.useRealTimers();
    httpTesting.verify();
  });

  it('loads the concert from the query string and prefills the schedule', () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/vehicles').flush([vehicle]);
    fixture.detectChanges();

    const details = httpTesting.expectOne('/api/concerts/c1');
    details.flush({ concert, trips: [] });
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component['form'].controls.concertId.value).toBe('c1');
    expect(component['form'].controls.departureAt.value).toBe(
      suggestSchedule(concert.startAt)?.departureAt,
    );
    expect(fixture.nativeElement.textContent).toContain('M72 World Tour');
  });
});
