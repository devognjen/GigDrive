import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, debounceTime, map, of, startWith, switchMap } from 'rxjs';

import { Trip } from '../../../core/models/trip.model';
import { TripCard } from '../trip-card/trip-card';
import { TripService } from '../trip.service';

interface VehicleTypeOption {
  value: string;
  label: string;
}

interface TripFilters {
  from: string;
  vehicleType: string;
  maxPrice: string;
  minRating: string;
  seatsMin: string;
  sort: 'soonest' | 'cheapest' | 'likely';
}

/**
 * Browse trips across the platform (or a single concert) with reactive
 * filters and sorting. Filter changes and the (per-concert) trips are combined
 * with `combineLatest` so the list re-renders on either source.
 */
@Component({
  selector: 'app-trip-list',
  imports: [ReactiveFormsModule, RouterLink, TripCard],
  templateUrl: './trip-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripList {
  private readonly tripService = inject(TripService);
  private readonly route = inject(ActivatedRoute);

  protected readonly vehicleTypeOptions: VehicleTypeOption[] = [
    { value: '', label: 'Any vehicle' },
    { value: 'CAR', label: 'Car' },
    { value: 'VAN', label: 'Van' },
    { value: 'MINIBUS', label: 'Minibus' },
  ];

  protected readonly concertId = signal<string | null>(
    this.route.snapshot.queryParamMap.get('concertId'),
  );

  protected readonly filters = new FormGroup({
    from: new FormControl('', { nonNullable: true }),
    vehicleType: new FormControl('', { nonNullable: true }),
    maxPrice: new FormControl('', { nonNullable: true }),
    minRating: new FormControl('', { nonNullable: true }),
    seatsMin: new FormControl('', { nonNullable: true }),
    sort: new FormControl<'soonest' | 'cheapest' | 'likely'>('soonest', { nonNullable: true }),
  });

  protected readonly trips = signal<Trip[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    const filters$ = this.filters.valueChanges.pipe(
      startWith(this.filters.getRawValue()),
      debounceTime(300),
    );

    // The list refreshes whenever the filters or the concertId change.
    combineLatest([filters$, toObservable(this.concertId)])
      .pipe(
        map(([filters, concertId]) => this.toParams(filters, concertId)),
        switchMap((params) => this.tripService.list(params).pipe(catchError(() => of<Trip[]>([])))),
        takeUntilDestroyed(),
      )
      .subscribe((trips) => {
        this.trips.set(trips);
        this.loading.set(false);
      });
  }

  private toParams(filters: Partial<TripFilters>, concertId: string | null) {
    return {
      ...(concertId ? { concertId } : {}),
      ...(filters.from?.trim() ? { from: filters.from.trim() } : {}),
      ...(filters.vehicleType ? { vehicleType: filters.vehicleType } : {}),
      ...(filters.maxPrice ? { maxPrice: Number(filters.maxPrice) * 100 } : {}),
      ...(filters.minRating ? { minRating: Number(filters.minRating) } : {}),
      ...(filters.seatsMin ? { seatsMin: Number(filters.seatsMin) } : {}),
      ...(filters.sort ? { sort: filters.sort } : {}),
    };
  }
}
