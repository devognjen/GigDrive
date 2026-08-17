import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { buildBooking, buildTrip } from '../../../testing/trip.fixture';
import { BookingList } from './booking-list';

describe('BookingList', () => {
  let fixture: ComponentFixture<BookingList>;
  let component: BookingList;

  const bookings = [
    buildBooking({ status: 'PENDING' }),
    buildBooking({
      id: 'b2',
      status: 'CONFIRMED',
      paid: false,
      seats: 1,
      trip: buildTrip({ livePrice: { perPerson: 2000, lowerBound: 3000, upperBound: 1500 } }),
    }),
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingList);
    component = fixture.componentInstance;
  });

  it('renders an empty state', () => {
    fixture.componentRef.setInput('emptyMessage', 'You have no bookings yet.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('You have no bookings yet.');
  });

  it('renders trip info, status, live price, and paid flag', () => {
    fixture.componentRef.setInput('bookings', bookings);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('PENDING');
    expect(text).toContain('CONFIRMED');
    expect(text).toContain('The Demo Band');
    expect(text).toContain('30.00 €');
    expect(text).toContain('Not paid');
  });

  it('emits accept and reject in driver mode', () => {
    fixture.componentRef.setInput('bookings', bookings);
    fixture.componentRef.setInput('mode', 'driver');
    fixture.detectChanges();

    const accepted: unknown[] = [];
    const rejected: unknown[] = [];
    component.accept.subscribe((booking) => accepted.push(booking));
    component.reject.subscribe((booking) => rejected.push(booking));

    fixture.nativeElement.querySelector('button.accept').click();
    fixture.nativeElement.querySelector('button.danger').click();

    expect(accepted).toEqual([bookings[0]]);
    expect(rejected).toEqual([bookings[0]]);
  });

  it('emits cancel in passenger mode', () => {
    fixture.componentRef.setInput('bookings', bookings);
    fixture.componentRef.setInput('mode', 'passenger');
    fixture.detectChanges();

    const cancelled: unknown[] = [];
    component.cancel.subscribe((booking) => cancelled.push(booking));
    fixture.nativeElement.querySelector('button.danger').click();
    expect(cancelled).toEqual([bookings[0]]);
  });
});
