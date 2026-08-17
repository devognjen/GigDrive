import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';

import { Trip } from '../../../core/models/trip.model';
import { TripsActions } from './trips.actions';

export interface TripsState extends EntityState<Trip> {
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const tripsAdapter = createEntityAdapter<Trip>();

const initialState: TripsState = tripsAdapter.getInitialState({
  loading: false,
  loaded: false,
  error: null,
});

const reducer = createReducer(
  initialState,
  on(TripsActions.loadMine, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TripsActions.loadMineSuccess, (state, { trips }) =>
    tripsAdapter.setAll(trips, { ...state, loading: false, loaded: true }),
  ),
  on(TripsActions.loadMineFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(TripsActions.upsertTrip, (state, { trip }) => tripsAdapter.upsertOne(trip, state)),
  on(TripsActions.upsertTrips, (state, { trips }) => tripsAdapter.upsertMany(trips, state)),
);

export const tripsFeature = createFeature({
  name: 'trips',
  reducer,
  extraSelectors: ({ selectTripsState }) => {
    const { selectAll, selectEntities } = tripsAdapter.getSelectors(selectTripsState);
    return {
      selectAllTrips: selectAll,
      selectTripEntities: selectEntities,
    };
  },
});
