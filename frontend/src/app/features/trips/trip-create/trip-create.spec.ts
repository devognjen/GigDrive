import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Vehicle } from '../../../core/models/vehicle.model';
import { buildTrip } from '../../../testing/trip.fixture';
import { TripCreate } from './trip-create';

const vehicle: Vehicle = {
  id: 'v1',
  ownerId: 'd1',
  type: 'VAN',
  make: 'VW',
  model: 'Transporter',
  seats: 8,
  notes: null,
};

describe('TripCreate', () => {
  let component: TripCreate;
  let fixture: ComponentFixture<TripCreate>;
  let httpTesting: HttpTestingController;
  let navigateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
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
    httpTesting.verify();
  });

  function flushVehicles(): void {
    httpTesting.expectOne('/api/vehicles').flush([vehicle]);
  }

  function fillValidForm(): void {
    component['form'].patchValue({
      vehicleId: vehicle.id,
      concertId: 'c1',
      pricingMode: 'SHARED_TOTAL',
      totalCost: 12000,
      currency: 'EUR',
      minPassengers: 4,
      maxPassengers: 8,
      confirmationDeadline: '2026-09-01T12:00',
      departureAt: '2026-09-10T14:00',
    });
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
    fixture.detectChanges();
    flushVehicles();
    fillValidForm();
    component['submit']();

    const req = httpTesting.expectOne('/api/trips');
    expect(req.request.body.stops).toEqual([{ seq: 1, place: 'Novi Sad' }]);
    req.flush(buildTrip({ id: 't-new' }));
    expect(navigateSpy).toHaveBeenCalledWith(['/trips', 't-new']);
  });

  it('includes optional stop coordinates when given', () => {
    fixture.detectChanges();
    flushVehicles();
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
});
