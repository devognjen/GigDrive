import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { buildTrip } from '../../../testing/trip.fixture';
import { TripCard } from './trip-card';

describe('TripCard', () => {
  let fixture: ComponentFixture<TripCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TripCard);
    fixture.componentRef.setInput('trip', buildTrip());
    fixture.detectChanges();
  });

  it('renders concert summary, status, seats, and live price', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('The Demo Band');
    expect(text).toContain('Summer Open Air');
    expect(text).toContain('OPEN');
    expect(text).toContain('0/8 seats');
    expect(text).toContain('30.00 €');
    expect(text).toContain('Novi Sad');
  });

  it('omits the driver name on the driver dashboard', () => {
    fixture.componentRef.setInput('showDriver', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Demo Driver');
  });

  it('shows driver rating when present', () => {
    fixture.componentRef.setInput('trip', buildTrip({ driverAverageRating: 4.5 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Rating 4.5');
  });
});
