import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Trip } from '../../../core/models/trip.model';
import { concertTitleDiffers } from '../../../core/utils/concert-display';
import { formatMoney } from '../../../core/utils/money';
import { ConcertMedia } from '../../concerts/concert-media/concert-media';

/**
 * Presentational trip summary used on browse and the driver dashboard.
 */
@Component({
  selector: 'app-trip-card',
  imports: [DatePipe, RouterLink, ConcertMedia],
  templateUrl: './trip-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripCard {
  @Input({ required: true }) trip!: Trip;
  /** When false, the driver's own name is omitted (driver dashboard). */
  @Input() showDriver = true;

  protected get retired(): boolean {
    return this.trip.status === 'CANCELLED' || this.trip.status === 'COMPLETED';
  }

  protected get showTitle(): boolean {
    return concertTitleDiffers(this.trip.concertArtist, this.trip.concertTitle);
  }

  protected formatPrice(minorUnits: number): string {
    return formatMoney(minorUnits, this.trip.currency);
  }
}
