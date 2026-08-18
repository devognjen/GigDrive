import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Concert } from '../../../core/models/concert.model';
import { concertTitleDiffers } from '../../../core/utils/concert-display';
import { ConcertMedia } from '../concert-media/concert-media';

/** Image-top concert tile used on the search results grid. */
@Component({
  selector: 'app-concert-card',
  imports: [DatePipe, RouterLink, ConcertMedia],
  templateUrl: './concert-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConcertCard {
  readonly concert = input.required<Concert>();

  protected showTitle(): boolean {
    const concert = this.concert();
    return concertTitleDiffers(concert.artist, concert.title);
  }
}
