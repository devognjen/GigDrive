import { tripsAdapter, tripsFeature } from './trips.reducer';
import { TripsActions } from './trips.actions';
import { buildTrip } from '../../../testing/trip.fixture';

describe('trips reducer', () => {
  const reducer = tripsFeature.reducer;
  const initial = reducer(undefined, { type: '[Init]' });

  it('starts empty and not loaded', () => {
    expect(initial.ids).toEqual([]);
    expect(initial.loading).toBe(false);
    expect(initial.loaded).toBe(false);
  });

  it('sets loading on loadMine', () => {
    const state = reducer(initial, TripsActions.loadMine());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('replaces the collection on loadMineSuccess', () => {
    const trips = [buildTrip(), buildTrip({ id: 't2' })];
    const state = reducer(initial, TripsActions.loadMineSuccess({ trips }));
    expect(state.ids).toEqual(['t1', 't2']);
    expect(state.loading).toBe(false);
    expect(state.loaded).toBe(true);
  });

  it('records an error on loadMineFailure', () => {
    const state = reducer(
      { ...initial, loading: true },
      TripsActions.loadMineFailure({ error: 'boom' }),
    );
    expect(state.loading).toBe(false);
    expect(state.error).toBe('boom');
  });

  it('upserts a trip without dropping the rest', () => {
    const loaded = reducer(initial, TripsActions.loadMineSuccess({ trips: [buildTrip()] }));
    const updated = buildTrip({
      confirmedSeats: 2,
      livePrice: { perPerson: 2000, lowerBound: 3000, upperBound: 1500 },
    });
    const state = reducer(loaded, TripsActions.upsertTrip({ trip: updated }));
    expect(tripsAdapter.getSelectors().selectAll(state)[0].confirmedSeats).toBe(2);
  });
});
