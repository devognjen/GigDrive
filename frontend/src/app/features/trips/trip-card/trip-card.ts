import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Trip } from '../../../core/models/trip.model';
import { formatMoney } from '../../../core/utils/money';

/**
 * Presentational trip summary used on browse and the driver dashboard.
 */
@Component({
  selector: 'app-trip-card',
  imports: [DatePipe, RouterLink],
  templateUrl: './trip-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripCard {
  @Input({ required: true }) trip!: Trip;
  /** When false, the driver's own name is omitted (driver dashboard). */
  @Input() showDriver = true;

  protected formatPrice(minorUnits: number): string {
    return formatMoney(minorUnits, this.trip.currency);
  }
}
