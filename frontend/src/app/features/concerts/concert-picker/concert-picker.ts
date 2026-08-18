import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { Concert } from '../../../core/models/concert.model';
import { todayIsoDate } from '../../../core/utils/local-datetime';
import { ConcertService } from '../concert.service';

@Component({
  selector: 'app-concert-picker',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './concert-picker.html',
  styleUrl: './concert-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConcertPicker implements OnInit {
  private readonly concertService = inject(ConcertService);
  private readonly destroyRef = inject(DestroyRef);

  /** Trip form control that stores the selected concert UUID. */
  readonly concertIdControl = input.required<FormControl<string>>();
  readonly concertChange = output<Concert | null>();

  protected readonly query = new FormControl('', { nonNullable: true });
  protected readonly results = signal<Concert[]>([]);
  protected readonly selected = signal<Concert | null>(null);
  protected readonly open = signal(false);
  protected readonly loading = signal(false);
  protected readonly searchFailed = signal(false);

  private searchStarted = false;

  ngOnInit(): void {
    const id = this.concertIdControl().value.trim();
    if (id) {
      this.loadSelected(id);
    } else {
      this.startSearch();
    }
  }

  protected select(concert: Concert, event?: Event): void {
    event?.preventDefault();
    this.selected.set(concert);
    this.concertIdControl().setValue(concert.id);
    this.concertIdControl().markAsTouched();
    this.concertChange.emit(concert);
    this.open.set(false);
    this.query.setValue('');
  }

  protected clear(): void {
    this.selected.set(null);
    this.concertIdControl().setValue('');
    this.concertChange.emit(null);
    this.startSearch();
  }

  private loadSelected(id: string): void {
    this.loading.set(true);
    this.concertService.getDetails(id).subscribe({
      next: (details) => {
        this.selected.set(details.concert);
        this.concertChange.emit(details.concert);
        this.loading.set(false);
      },
      error: () => {
        this.selected.set(null);
        this.concertIdControl().setValue('');
        this.concertChange.emit(null);
        this.loading.set(false);
        this.startSearch();
      },
    });
  }

  private startSearch(): void {
    if (this.searchStarted) {
      this.open.set(true);
      return;
    }
    this.searchStarted = true;
    this.query.valueChanges
      .pipe(
        startWith(this.query.getRawValue()),
        debounceTime(300),
        map((value) => value.trim()),
        distinctUntilChanged(),
        tap(() => {
          this.loading.set(true);
          this.searchFailed.set(false);
          this.open.set(true);
        }),
        switchMap((q) => {
          const request$ = q
            ? this.concertService.search({ q, dateFrom: todayIsoDate() })
            : this.concertService.listUpcoming();
          return request$.pipe(
            catchError(() => {
              this.searchFailed.set(true);
              return of<Concert[]>([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((concerts) => {
        this.results.set(concerts);
        this.loading.set(false);
      });
  }
}
