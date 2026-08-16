import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';

import { Booking } from '../../../core/models/booking.model';
import { BookingService } from '../booking.service';

/**
 * Passenger's own bookings with their current status and paid flag. Provides a
 * cancel action for PENDING/CONFIRMED bookings (FR-BOOK-03).
 */
@Component({
  selector: 'app-my-bookings',
  imports: [DatePipe],
  templateUrl: './my-bookings.html',
  styleUrl: './my-bookings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyBookings {
  private readonly bookingService = inject(BookingService);

  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loading = signal(true);
  protected readonly actionError = signal<string | null>(null);
  protected readonly cancelPending = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.bookingService
      .listMine()
      .pipe(
        tap(() => this.loading.set(false)),
        catchError(() => {
          this.loading.set(false);
          return of<Booking[]>([]);
        }),
        takeUntilDestroyed(),
      )
      .subscribe((bookings) => this.bookings.set(bookings));
  }

  protected canCancel(booking: Booking): boolean {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  }

  protected cancel(booking: Booking): void {
    if (this.cancelPending()) {
      return;
    }
    this.cancelPending.set(booking.id);
    this.actionError.set(null);
    this.bookingService.cancel(booking.id).subscribe({
      next: (updated) => {
        this.bookings.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
        this.cancelPending.set(null);
      },
      error: () => {
        this.cancelPending.set(null);
        this.actionError.set('Could not cancel the booking.');
      },
    });
  }
}
