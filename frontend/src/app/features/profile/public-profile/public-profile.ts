import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Review } from '../../../core/models/review.model';
import { PublicProfile as PublicProfileModel } from '../../../core/models/user.model';
import { ReviewService } from '../../reviews/review.service';
import { ProfileService } from '../profile.service';

@Component({
  selector: 'app-public-profile',
  imports: [DatePipe],
  templateUrl: './public-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicProfile {
  private readonly profileService = inject(ProfileService);
  private readonly reviewService = inject(ReviewService);

  protected readonly profile = signal<PublicProfileModel | null>(null);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly notFound = signal(false);

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    this.profileService.getPublicProfile(id).subscribe({
      next: (profile) => this.profile.set(profile),
      error: () => this.notFound.set(true),
    });
    this.reviewService.listForDriver(id).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => this.reviews.set([]),
    });
  }
}
