import { provideEffects } from '@ngrx/effects';
import { provideState } from '@ngrx/store';

import { bookingsEffects } from '../../bookings/store/bookings.effects';
import { bookingsFeature } from '../../bookings/store/bookings.reducer';
import { tripsEffects } from '../../trips/store/trips.effects';
import { tripsFeature } from '../../trips/store/trips.reducer';

/** NgRx trips/bookings slices used by the driver and passenger dashboards. */
export const dashboardStoreProviders = [
  provideState(tripsFeature),
  provideState(bookingsFeature),
  provideEffects(tripsEffects, bookingsEffects),
];
