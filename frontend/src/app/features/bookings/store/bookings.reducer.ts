import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';

import { Booking } from '../../../core/models/booking.model';
import { BookingsActions } from './bookings.actions';

export interface BookingsState extends EntityState<Booking> {
  loading: boolean;
  loaded: boolean;
  error: string | null;
  pendingId: string | null;
}

export const bookingsAdapter = createEntityAdapter<Booking>();

const initialState: BookingsState = bookingsAdapter.getInitialState({
  loading: false,
  loaded: false,
  error: null,
  pendingId: null,
});

const reducer = createReducer(
  initialState,
  on(BookingsActions.loadMine, BookingsActions.loadForDriver, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(BookingsActions.loadMineSuccess, BookingsActions.loadForDriverSuccess, (state, { bookings }) =>
    bookingsAdapter.setAll(bookings, {
      ...state,
      loading: false,
      loaded: true,
      pendingId: null,
    }),
  ),
  on(BookingsActions.loadMineFailure, BookingsActions.loadForDriverFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(BookingsActions.accept, BookingsActions.reject, BookingsActions.cancel, (state, { id }) => ({
    ...state,
    pendingId: id,
    error: null,
  })),
  on(BookingsActions.setPaid, (state, { id }) => ({
    ...state,
    pendingId: id,
    error: null,
  })),
  on(BookingsActions.mutationSuccess, (state, { booking }) =>
    bookingsAdapter.upsertOne(booking, { ...state, pendingId: null }),
  ),
  on(BookingsActions.mutationFailure, (state, { error }) => ({
    ...state,
    pendingId: null,
    error,
  })),
);

export const bookingsFeature = createFeature({
  name: 'bookings',
  reducer,
  extraSelectors: ({ selectBookingsState }) => {
    const { selectAll, selectEntities } = bookingsAdapter.getSelectors(selectBookingsState);
    return {
      selectAllBookings: selectAll,
      selectBookingEntities: selectEntities,
    };
  },
});
