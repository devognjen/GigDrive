import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { Concert, ConcertSearchParams } from '../../../core/models/concert.model';
import { ConcertService } from '../concert.service';

@Component({
  selector: 'app-concert-search',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './concert-search.html',
  styleUrl: './concert-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConcertSearch {
  private readonly concertService = inject(ConcertService);
  protected readonly authService = inject(AuthService);

  protected readonly filters = new FormGroup({
    q: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true }),
    dateFrom: new FormControl('', { nonNullable: true }),
    dateTo: new FormControl('', { nonNullable: true }),
    genre: new FormControl('', { nonNullable: true }),
  });

  protected readonly results = signal<Concert[]>([]);
  protected readonly loading = signal(true);
  protected readonly searchFailed = signal(false);
  protected readonly cities = signal<string[]>([]);
  protected readonly genres = signal<string[]>([]);

  constructor() {
    this.concertService
      .getFilterOptions()
      .pipe(
        catchError(() => of({ cities: [], genres: [] })),
        takeUntilDestroyed(),
      )
      .subscribe((options) => {
        this.cities.set(options.cities);
        this.genres.set(options.genres);
      });

    // Instant search: debounce keystrokes, skip emissions that do not change
    // the serialized params, and let switchMap cancel a stale request when a
    // newer search comes in before the previous one answered. A failing
    // request is caught per emission so the stream stays alive.
    this.filters.valueChanges
      .pipe(
        startWith(this.filters.getRawValue()),
        debounceTime(300),
        map(() => this.toSearchParams()),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => {
          this.loading.set(true);
          this.searchFailed.set(false);
        }),
        switchMap((params) =>
          this.concertService.search(params).pipe(
            catchError(() => {
              this.searchFailed.set(true);
              return of<Concert[]>([]);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((concerts) => {
        this.results.set(concerts);
        this.loading.set(false);
      });
  }

  private toSearchParams(): ConcertSearchParams {
    const { q, city, dateFrom, dateTo, genre } = this.filters.getRawValue();
    return {
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(city.trim() ? { city: city.trim() } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      ...(genre.trim() ? { genre: genre.trim() } : {}),
    };
  }
}
