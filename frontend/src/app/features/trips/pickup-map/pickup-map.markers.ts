import { TripStop } from '../../../core/models/trip.model';

/** A pickup stop that can be plotted on the map. */
export interface MapMarker {
  seq: number;
  place: string;
  lat: number;
  lng: number;
}

function hasCoordinate(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Keeps stops that have both lat and lng, then orders them by `seq`.
 * The map component plots this list; trips without coordinates yield [].
 */
export function toMapMarkers(stops: readonly TripStop[]): MapMarker[] {
  return stops
    .filter(
      (stop): stop is TripStop & { lat: number; lng: number } =>
        hasCoordinate(stop.lat) && hasCoordinate(stop.lng),
    )
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .map((stop) => ({
      seq: stop.seq,
      place: stop.place,
      lat: stop.lat,
      lng: stop.lng,
    }));
}
