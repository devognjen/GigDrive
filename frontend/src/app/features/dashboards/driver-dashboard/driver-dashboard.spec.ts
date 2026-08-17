import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { buildBooking, buildTrip } from '../../../testing/trip.fixture';
import { BookingsActions } from '../../bookings/store/bookings.actions';
import { TripsActions } from '../../trips/store/trips.actions';
import {
  selectDashboardError,
  selectDriverLoading,
  selectDriverBookings,
  selectDriverTrips,
  selectEarnings,
  selectPendingBookingId,
} from '../store/dashboards.selectors';
import { DriverDashboard } from './driver-dashboard';

describe('DriverDashboard', () => {
  let fixture: ComponentFixture<DriverDashboard>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverDashboard],
      providers: [
        provideRouter([]),
        provideMockStore({
          selectors: [
            { selector: selectDriverTrips, value: [buildTrip()] },
            { selector: selectDriverBookings, value: [buildBooking()] },
            {
              selector: selectEarnings,
              value: [{ currency: 'EUR', total: 6000, paid: 0, unpaid: 6000 }],
            },
            { selector: selectDriverLoading, value: false },
            { selector: selectDashboardError, value: null },
            { selector: selectPendingBookingId, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(DriverDashboard);
    fixture.detectChanges();
  });

  it('dispatches load actions on enter', () => {
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    TestBed.createComponent(DriverDashboard);
    expect(dispatchSpy).toHaveBeenCalledWith(TripsActions.loadMine());
    expect(dispatchSpy).toHaveBeenCalledWith(BookingsActions.loadForDriver());
  });

  it('renders trips, pending requests, and earnings', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Driver dashboard');
    expect(text).toContain('The Demo Band');
    expect(text).toContain('60.00 €');
    expect(text).toContain('Accept');
  });

  it('shows empty states when there is no data', () => {
    store.overrideSelector(selectDriverTrips, []);
    store.overrideSelector(selectDriverBookings, []);
    store.overrideSelector(selectEarnings, []);
    store.refreshState();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('You have not organized any trips yet.');
    expect(text).toContain('No booking requests yet.');
    expect(text).toContain('No confirmed bookings yet');
  });
});
