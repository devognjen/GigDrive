import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Observable, Subject, of, throwError } from 'rxjs';

import { buildTrip } from '../../../testing/trip.fixture';
import { TripService } from '../trip.service';
import { TripsActions } from './trips.actions';
import { loadMine } from './trips.effects';

describe('trips effects', () => {
  let actions$: Observable<Action>;
  let actionsSubject: Subject<Action>;
  let tripService: { listMine: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    actionsSubject = new Subject<Action>();
    actions$ = actionsSubject.asObservable();
    tripService = { listMine: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        { provide: TripService, useValue: tripService },
      ],
    });
  });

  it('loads the driver trips', () => {
    const trips = [buildTrip()];
    tripService.listMine.mockReturnValue(of(trips));
    const results: Action[] = [];
    TestBed.runInInjectionContext(() => loadMine()).subscribe((action) => results.push(action));

    actionsSubject.next(TripsActions.loadMine());

    expect(results).toEqual([TripsActions.loadMineSuccess({ trips })]);
  });

  it('fails when the trips request errors', () => {
    tripService.listMine.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const results: Action[] = [];
    TestBed.runInInjectionContext(() => loadMine()).subscribe((action) => results.push(action));

    actionsSubject.next(TripsActions.loadMine());

    expect(results).toEqual([
      TripsActions.loadMineFailure({ error: 'Could not load your trips.' }),
    ]);
  });
});
