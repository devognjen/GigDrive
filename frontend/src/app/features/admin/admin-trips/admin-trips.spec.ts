import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { buildTrip } from '../../../testing/trip.fixture';
import { AdminTrips } from './admin-trips';

describe('AdminTrips', () => {
  let fixture: ComponentFixture<AdminTrips>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTrips],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminTrips);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('shows an empty state', async () => {
    fixture.detectChanges();
    httpTesting.expectOne('/api/admin/trips').flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No trips in this filter.');
  });

  it('force-cancels a trip', async () => {
    const trip = buildTrip({ status: 'OPEN' });
    fixture.detectChanges();
    httpTesting.expectOne('/api/admin/trips').flush([trip]);
    await fixture.whenStable();
    fixture.detectChanges();

    const button = [...fixture.nativeElement.querySelectorAll('button')].find((el) =>
      el.textContent?.includes('Force cancel'),
    ) as HTMLButtonElement;
    button.click();
    httpTesting.expectOne('/api/admin/trips/t1/cancel').flush({ ...trip, status: 'CANCELLED' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Force cancel');
  });
});
