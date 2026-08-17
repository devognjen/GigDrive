import { TripStop } from '../../../core/models/trip.model';
import { toMapMarkers } from './pickup-map.markers';

function stop(overrides: Partial<TripStop>): TripStop {
  return {
    id: overrides.id ?? 's',
    seq: overrides.seq ?? 1,
    place: overrides.place ?? 'Somewhere',
    lat: overrides.lat ?? null,
    lng: overrides.lng ?? null,
    plannedTime: overrides.plannedTime ?? null,
  };
}

describe('toMapMarkers', () => {
  it('returns an empty list when there are no stops', () => {
    expect(toMapMarkers([])).toEqual([]);
  });

  it('drops stops that are missing lat or lng', () => {
    expect(
      toMapMarkers([
        stop({ id: 'a', seq: 1, place: 'No coords', lat: null, lng: null }),
        stop({ id: 'b', seq: 2, place: 'Lat only', lat: 45.2, lng: null }),
        stop({ id: 'c', seq: 3, place: 'Lng only', lat: null, lng: 19.8 }),
      ]),
    ).toEqual([]);
  });

  it('drops non-finite coordinates', () => {
    expect(
      toMapMarkers([
        stop({ id: 'nan', seq: 1, lat: Number.NaN, lng: 19.8 }),
        stop({ id: 'inf', seq: 2, lat: 45.2, lng: Number.POSITIVE_INFINITY }),
      ]),
    ).toEqual([]);
  });

  it('keeps stops that have both coordinates', () => {
    expect(
      toMapMarkers([
        stop({ id: 'a', seq: 1, place: 'Novi Sad', lat: 45.2649, lng: 19.8296 }),
        stop({ id: 'b', seq: 2, place: 'No pin', lat: null, lng: null }),
        stop({ id: 'c', seq: 3, place: 'Stara Pazova', lat: 44.985, lng: 20.1608 }),
      ]),
    ).toEqual([
      { seq: 1, place: 'Novi Sad', lat: 45.2649, lng: 19.8296 },
      { seq: 3, place: 'Stara Pazova', lat: 44.985, lng: 20.1608 },
    ]);
  });

  it('orders markers by seq regardless of input order', () => {
    expect(
      toMapMarkers([
        stop({ id: 'b', seq: 2, place: 'Second', lat: 44.8, lng: 20.4 }),
        stop({ id: 'a', seq: 1, place: 'First', lat: 45.2, lng: 19.8 }),
      ]),
    ).toEqual([
      { seq: 1, place: 'First', lat: 45.2, lng: 19.8 },
      { seq: 2, place: 'Second', lat: 44.8, lng: 20.4 },
    ]);
  });

  it('treats a zero coordinate as valid', () => {
    expect(toMapMarkers([stop({ id: 'eq', seq: 1, place: 'Null Island', lat: 0, lng: 0 })])).toEqual([
      { seq: 1, place: 'Null Island', lat: 0, lng: 0 },
    ]);
  });
});
