import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { Booking } from '../../../core/models/booking.model';

export const BookingsActions = createActionGroup({
  source: 'Bookings',
  events: {
    'Load Mine': emptyProps(),
    'Load Mine Success': props<{ bookings: Booking[] }>(),
    'Load Mine Failure': props<{ error: string }>(),
    'Load For Driver': emptyProps(),
    'Load For Driver Success': props<{ bookings: Booking[] }>(),
    'Load For Driver Failure': props<{ error: string }>(),
    Accept: props<{ id: string }>(),
    Reject: props<{ id: string }>(),
    Cancel: props<{ id: string }>(),
    'Set Paid': props<{ id: string; paid: boolean }>(),
    'Mutation Success': props<{ booking: Booking }>(),
    'Mutation Failure': props<{ error: string }>(),
  },
});
