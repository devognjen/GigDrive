import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';

import { TripService } from '../trip.service';
import { TripsActions } from './trips.actions';

export const loadMine = createEffect(
  (actions$ = inject(Actions), tripService = inject(TripService)) =>
    actions$.pipe(
      ofType(TripsActions.loadMine),
      exhaustMap(() =>
        tripService.listMine().pipe(
          map((trips) => TripsActions.loadMineSuccess({ trips })),
          catchError(() =>
            of(TripsActions.loadMineFailure({ error: 'Could not load your trips.' })),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const tripsEffects = [loadMine];
