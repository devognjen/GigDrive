import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { vi } from 'vitest';

import { Vehicle } from '../../../core/models/vehicle.model';
import { Vehicles } from './vehicles';

const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    ownerId: 'u1',
    type: 'CAR',
    make: 'Škoda',
    model: 'Octavia',
    seats: 3,
    notes: null,
  },
  {
    id: 'v2',
    ownerId: 'u1',
    type: 'VAN',
    make: 'Volkswagen',
    model: 'Multivan',
    seats: 6,
    notes: 'Roof box available',
  },
];

describe('Vehicles', () => {
  let component: Vehicles;
  let fixture: ComponentFixture<Vehicles>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vehicles],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Vehicles);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpTesting.expectOne('/api/vehicles').flush(mockVehicles);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists the vehicles of the user', () => {
    const items = fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Škoda Octavia');
    expect(items[1].textContent).toContain('6 seats');
  });

  it('creates a vehicle and appends it to the list', () => {
    component['form'].setValue({
      type: 'MINIBUS',
      make: 'Mercedes',
      model: 'Vito',
      seats: 8,
      notes: '',
    });
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const req = httpTesting.expectOne('/api/vehicles');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      type: 'MINIBUS',
      make: 'Mercedes',
      model: 'Vito',
      seats: 8,
    });
    req.flush({
      id: 'v3',
      ownerId: 'u1',
      type: 'MINIBUS',
      make: 'Mercedes',
      model: 'Vito',
      seats: 8,
      notes: null,
    });
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(3);
    expect(items[2].textContent).toContain('Mercedes Vito');
  });

  it('edits a vehicle and sends a PATCH', () => {
    const editButtons = fixture.nativeElement.querySelectorAll(
      'li button',
    ) as NodeListOf<HTMLButtonElement>;
    editButtons[0].click();
    fixture.detectChanges();

    expect(component['form'].getRawValue()).toEqual({
      type: 'CAR',
      make: 'Škoda',
      model: 'Octavia',
      seats: 3,
      notes: '',
    });

    component['form'].controls.seats.setValue(4);
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));

    const req = httpTesting.expectOne('/api/vehicles/v1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.seats).toBe(4);
    req.flush({ ...mockVehicles[0], seats: 4 });
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>;
    expect(items[0].textContent).toContain('4 seats');
  });

  it('deletes a vehicle after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const deleteButtons = fixture.nativeElement.querySelectorAll(
      'li button.danger',
    ) as NodeListOf<HTMLButtonElement>;
    deleteButtons[0].click();

    const req = httpTesting.expectOne('/api/vehicles/v1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>;
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Multivan');
  });

  it('does not send a delete request when the confirmation is declined', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const deleteButtons = fixture.nativeElement.querySelectorAll(
      'li button.danger',
    ) as NodeListOf<HTMLButtonElement>;
    deleteButtons[0].click();

    httpTesting.expectNone('/api/vehicles/v1');
  });

  it('shows a specific error when the vehicle is referenced by trips', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const deleteButtons = fixture.nativeElement.querySelectorAll(
      'li button.danger',
    ) as NodeListOf<HTMLButtonElement>;
    deleteButtons[0].click();

    httpTesting
      .expectOne('/api/vehicles/v1')
      .flush(
        { message: 'Vehicle is used by existing trips and cannot be deleted' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role=alert]') as HTMLElement;
    expect(alert.textContent).toContain('used by existing trips');
    // The vehicle stays in the list.
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(2);
  });

  it('blocks submit while the form is invalid', () => {
    component['form'].controls.make.setValue('');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button[type=submit]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
