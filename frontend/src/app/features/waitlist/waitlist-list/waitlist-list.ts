import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { WaitlistEntry } from '../../../core/models/waitlist.model';

/**
 * Presentational list of the passenger's waitlist entries with queue
 * position and a leave action.
 */
@Component({
  selector: 'app-waitlist-list',
  imports: [DatePipe, RouterLink],
  templateUrl: './waitlist-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitlistList {
  @Input() entries: WaitlistEntry[] = [];
  @Input() pendingTripId: string | null = null;
  @Input() emptyMessage = 'You are not on any waitlists.';

  @Output() leave = new EventEmitter<WaitlistEntry>();
}
