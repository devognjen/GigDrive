import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Booking } from '../../../core/models/booking.model';
import { formatMoney } from '../../../core/utils/money';

export type BookingListMode = 'driver' | 'passenger';

/**
 * Presentational list of bookings. Driver mode exposes accept/reject/paid;
 * passenger mode exposes cancel on PENDING/CONFIRMED rows.
 */
@Component({
  selector: 'app-booking-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './booking-list.html',
  styleUrl: './booking-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingList {
  @Input() bookings: Booking[] = [];
  @Input() mode: BookingListMode = 'passenger';
  @Input() pendingId: string | null = null;
  @Input() emptyMessage = 'No bookings yet.';

  @Output() accept = new EventEmitter<Booking>();
  @Output() reject = new EventEmitter<Booking>();
  @Output() cancel = new EventEmitter<Booking>();
  @Output() togglePaid = new EventEmitter<Booking>();

  protected canCancel(booking: Booking): boolean {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  }

  protected formatPrice(booking: Booking): string {
    return formatMoney(booking.trip.livePrice.perPerson, booking.trip.currency);
  }
}
