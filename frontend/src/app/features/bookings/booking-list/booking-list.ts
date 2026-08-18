import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Booking } from '../../../core/models/booking.model';
import { concertTitleDiffers } from '../../../core/utils/concert-display';
import { formatMoney } from '../../../core/utils/money';
import { ConcertMedia } from '../../concerts/concert-media/concert-media';
import { ReviewForm } from '../../reviews/review-form/review-form';

export type BookingListMode = 'driver' | 'passenger';

export interface ReviewSubmission {
  booking: Booking;
  rating: number;
  comment: string;
}

/**
 * Presentational list of bookings. Driver mode exposes accept/reject/paid;
 * passenger mode exposes cancel on PENDING/CONFIRMED rows and a review form
 * on eligible past trips.
 */
@Component({
  selector: 'app-booking-list',
  imports: [DatePipe, RouterLink, ReviewForm, ConcertMedia],
  templateUrl: './booking-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingList {
  @Input() bookings: Booking[] = [];
  @Input() mode: BookingListMode = 'passenger';
  @Input() pendingId: string | null = null;
  @Input() reviewPendingTripId: string | null = null;
  @Input() emptyMessage = 'No bookings yet.';

  @Output() accept = new EventEmitter<Booking>();
  @Output() reject = new EventEmitter<Booking>();
  @Output() cancel = new EventEmitter<Booking>();
  @Output() togglePaid = new EventEmitter<Booking>();
  @Output() review = new EventEmitter<ReviewSubmission>();

  protected canCancel(booking: Booking): boolean {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  }

  protected formatPrice(booking: Booking): string {
    return formatMoney(booking.trip.livePrice.perPerson, booking.trip.currency);
  }

  protected showTitle(booking: Booking): boolean {
    return concertTitleDiffers(booking.trip.concertArtist, booking.trip.concertTitle);
  }
}
