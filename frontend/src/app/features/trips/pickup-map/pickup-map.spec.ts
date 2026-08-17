import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripStop } from '../../../core/models/trip.model';
import { PickupMap } from './pickup-map';

const mappedStop: TripStop = {
  id: 's1',
  seq: 1,
  place: 'Novi Sad',
  lat: 45.2649,
  lng: 19.8296,
  plannedTime: null,
};

const unmappedStop: TripStop = {
  id: 's2',
  seq: 2,
  place: 'Unknown',
  lat: null,
  lng: null,
  plannedTime: null,
};

describe('PickupMap', () => {
  let fixture: ComponentFixture<PickupMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PickupMap],
    }).compileComponents();

    fixture = TestBed.createComponent(PickupMap);
  });

  it('renders a map canvas when at least one stop has coordinates', () => {
    fixture.componentRef.setInput('stops', [mappedStop, unmappedStop]);
    fixture.detectChanges();

    const canvas = fixture.nativeElement.querySelector('.pickup-map-canvas') as HTMLElement | null;
    expect(canvas).not.toBeNull();
    expect(
      (fixture.nativeElement.querySelector('[role="img"]') as HTMLElement).getAttribute('aria-label'),
    ).toContain('1 marked');
  });

  it('renders nothing when no stop has coordinates', () => {
    fixture.componentRef.setInput('stops', [unmappedStop]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pickup-map-canvas')).toBeNull();
  });
});
