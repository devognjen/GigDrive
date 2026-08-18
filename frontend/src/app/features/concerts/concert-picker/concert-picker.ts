import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
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
import { ConcertMedia } from '../concert-media/concert-media';
import { ConcertService } from '../concert.service';

@Component({
  selector: 'app-concert-picker',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, ConcertMedia],
  templateUrl: './concert-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConcertPicker implements OnInit {
  private readonly concertService = inject(ConcertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Trip form control that stores the selected concert UUID. */
  readonly concertIdControl = input.required<FormControl<string>>();
  readonly concertChange = output<Concert | null>();

  protected readonly query = new FormControl('', { nonNullable: true });
  protected readonly results = signal<Concert[]>([]);
  protected readonly selected = signal<Concert | null>(null);
  protected readonly open = signal(false);
  protected readonly loading = signal(false);
  protected readonly searchFailed = signal(false);
  protected readonly activeIndex = signal(-1);

  private searchStarted = false;

  ngOnInit(): void {
    const id = this.concertIdControl().value.trim();
    if (id) {
      this.loadSelected(id);
    }
  }

  protected onFocus(): void {
    this.openPanel();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.open.set(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.open()) {
        this.openPanel();
        return;
      }
      this.moveActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) {
        this.openPanel();
        return;
      }
      this.moveActive(-1);
      return;
    }
    if (event.key === 'Enter' && this.open()) {
      event.preventDefault();
      const concert = this.results()[this.activeIndex()];
      if (concert) {
        this.select(concert);
      }
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.open()) {
      return;
    }
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected select(concert: Concert, event?: Event): void {
    event?.preventDefault();
    this.selected.set(concert);
    this.concertIdControl().setValue(concert.id);
    this.concertIdControl().markAsTouched();
    this.concertChange.emit(concert);
    this.open.set(false);
    this.query.setValue('', { emitEvent: false });
  }

  protected clear(): void {
    this.selected.set(null);
    this.concertIdControl().setValue('');
    this.concertChange.emit(null);
    this.openPanel();
  }

  /** Ticketmaster often repeats the artist as the title; show the name once. */
  protected showTitle(concert: Concert): boolean {
    return concert.artist !== concert.title;
  }

  protected optionId(id: string): string {
    return `concert-option-${id}`;
  }

  protected activeOptionId(): string | null {
    if (!this.open()) {
      return null;
    }
    const concert = this.results()[this.activeIndex()];
    return concert ? this.optionId(concert.id) : null;
  }

  private openPanel(): void {
    this.open.set(true);
    if (!this.searchStarted) {
      this.loading.set(true);
    }
    this.startSearch();
  }

  private moveActive(delta: number): void {
    const count = this.results().length;
    if (count === 0) {
      this.activeIndex.set(-1);
      return;
    }
    const next = (this.activeIndex() + delta + count) % count;
    this.activeIndex.set(next);
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
      },
    });
  }

  private startSearch(): void {
    if (this.searchStarted) {
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
        this.activeIndex.set(concerts.length > 0 ? 0 : -1);
        this.loading.set(false);
      });
  }
}
