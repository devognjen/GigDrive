import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { Trip } from '../../../core/models/trip.model';

export const TripsActions = createActionGroup({
  source: 'Trips',
  events: {
    'Load Mine': emptyProps(),
    'Load Mine Success': props<{ trips: Trip[] }>(),
    'Load Mine Failure': props<{ error: string }>(),
    'Upsert Trip': props<{ trip: Trip }>(),
    'Upsert Trips': props<{ trips: Trip[] }>(),
  },
});
