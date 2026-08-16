import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { Booking } from '../../../core/models/booking.model';
import { BookingService } from '../booking.service';

/**
 * Driver view of incoming booking requests across their trips, with
 * accept/reject and a paid toggle (FR-BOOK-02, FR-BOOK-04). Feature 08 will
 * aggregate this into the driver dashboard.
 */
@Component({
  selector: 'app-driver-bookings',
  imports: [DatePipe],
  templateUrl: './driver-bookings.html',
  styleUrl: './driver-bookings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriverBookings {
  private readonly bookingService = inject(BookingService);

  protected readonly bookings = signal<Booking[]>([]);
  protected readonly loading = signal(true);
  protected readonly actionError = signal<string | null>(null);
  protected readonly pendingId = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.bookingService
      .listForDriver()
      .pipe(
        tap(() => this.loading.set(false)),
        catchError(() => {
          this.loading.set(false);
          return of<Booking[]>([]);
        }),
      )
      .subscribe((bookings) => this.bookings.set(bookings));
  }

  protected accept(booking: Booking): void {
    this.runAction(booking.id, this.bookingService.accept(booking.id));
  }

  protected reject(booking: Booking): void {
    this.runAction(booking.id, this.bookingService.reject(booking.id));
  }

  protected togglePaid(booking: Booking): void {
    this.runAction(booking.id, this.bookingService.setPaid(booking.id, !booking.paid));
  }

  private runAction(id: string, action: Observable<Booking>): void {
    if (this.pendingId()) {
      return;
    }
    this.pendingId.set(id);
    this.actionError.set(null);
    action.subscribe({
      next: (updated) => {
        this.bookings.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
        this.pendingId.set(null);
      },
      error: () => {
        this.pendingId.set(null);
        this.actionError.set('The action could not be completed.');
      },
    });
  }
}
