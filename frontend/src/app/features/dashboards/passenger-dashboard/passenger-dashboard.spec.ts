import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { buildBooking } from '../../../testing/trip.fixture';
import { BookingsActions } from '../../bookings/store/bookings.actions';
import {
  selectDashboardError,
  selectPassengerLoading,
  selectPassengerBookings,
  selectPendingBookingId,
} from '../store/dashboards.selectors';
import { PassengerDashboard } from './passenger-dashboard';

describe('PassengerDashboard', () => {
  let fixture: ComponentFixture<PassengerDashboard>;
  let store: MockStore;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerDashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore({
          selectors: [
            { selector: selectPassengerBookings, value: [buildBooking({ status: 'CONFIRMED' })] },
            { selector: selectPassengerLoading, value: false },
            { selector: selectDashboardError, value: null },
            { selector: selectPendingBookingId, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PassengerDashboard);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('dispatches loadMine on enter', () => {
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    TestBed.createComponent(PassengerDashboard);
    expect(dispatchSpy).toHaveBeenCalledWith(BookingsActions.loadMine());
  });

  it('renders own bookings with status and live price', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Passenger dashboard');
    expect(text).toContain('CONFIRMED');
    expect(text).toContain('The Demo Band');
    expect(text).toContain('30.00 €');
    expect(text).toContain('Cancel');
  });

  it('renders an empty state', () => {
    store.overrideSelector(selectPassengerBookings, []);
    store.refreshState();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('You have no bookings yet.');
  });

  it('posts a review and reloads bookings', () => {
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    fixture.componentInstance['submitReview']({
      booking: buildBooking({ status: 'CONFIRMED', canReview: true }),
      rating: 5,
      comment: 'Great ride',
    });

    const req = httpTesting.expectOne('/api/trips/t1/reviews');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ rating: 5, comment: 'Great ride' });
    req.flush({ id: 'r1' });

    expect(dispatchSpy).toHaveBeenCalledWith(BookingsActions.loadMine());
  });
});
