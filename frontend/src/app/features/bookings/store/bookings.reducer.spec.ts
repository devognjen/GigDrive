import { bookingsFeature } from './bookings.reducer';
import { BookingsActions } from './bookings.actions';
import { buildBooking } from '../../../testing/trip.fixture';

describe('bookings reducer', () => {
  const reducer = bookingsFeature.reducer;
  const initial = reducer(undefined, { type: '[Init]' });

  it('starts empty and not loaded', () => {
    expect(initial.ids).toEqual([]);
    expect(initial.pendingId).toBeNull();
  });

  it('replaces the collection on loadMineSuccess', () => {
    const bookings = [buildBooking(), buildBooking({ id: 'b2' })];
    const state = reducer(initial, BookingsActions.loadMineSuccess({ bookings }));
    expect(state.ids).toEqual(['b1', 'b2']);
    expect(state.loaded).toBe(true);
    expect(state.loading).toBe(false);
  });

  it('sets pendingId on accept and clears it on success', () => {
    const booking = buildBooking();
    const loaded = reducer(initial, BookingsActions.loadMineSuccess({ bookings: [booking] }));
    const pending = reducer(loaded, BookingsActions.accept({ id: booking.id }));
    expect(pending.pendingId).toBe(booking.id);

    const updated = buildBooking({ status: 'CONFIRMED' });
    const done = reducer(pending, BookingsActions.mutationSuccess({ booking: updated }));
    expect(done.pendingId).toBeNull();
    expect(done.entities[booking.id]?.status).toBe('CONFIRMED');
  });

  it('records mutation errors', () => {
    const state = reducer(initial, BookingsActions.mutationFailure({ error: 'no seats' }));
    expect(state.error).toBe('no seats');
    expect(state.pendingId).toBeNull();
  });
});
