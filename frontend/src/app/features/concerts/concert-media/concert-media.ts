import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { concertInitial } from '../../../core/utils/concert-display';

/**
 * Concert artwork or a branded placeholder. `cover` is a 16:9 block for
 * listing cards; `thumb` is a 40px square for compact rows.
 */
@Component({
  selector: 'app-concert-media',
  templateUrl: './concert-media.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
})
export class ConcertMedia {
  readonly imageUrl = input<string | null>(null);
  readonly artist = input.required<string>();
  readonly variant = input<'cover' | 'thumb'>('cover');

  protected initial(): string {
    return concertInitial(this.artist());
  }

  protected imageClass(): string {
    return this.variant() === 'thumb'
      ? 'size-10 shrink-0 rounded-lg object-cover bg-night-soft'
      : 'aspect-video w-full object-cover bg-night-soft';
  }

  protected placeholderClass(): string {
    const gradient = 'flex items-center justify-center bg-linear-to-br from-stage to-night';
    return this.variant() === 'thumb'
      ? `${gradient} size-10 shrink-0 rounded-lg`
      : `${gradient} aspect-video w-full`;
  }

  protected initialClass(): string {
    return this.variant() === 'thumb'
      ? 'font-display text-sm font-bold text-paper'
      : 'font-display text-4xl font-bold text-paper';
  }
}
