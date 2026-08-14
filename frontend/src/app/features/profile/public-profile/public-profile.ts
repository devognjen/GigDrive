import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PublicProfile as PublicProfileModel } from '../../../core/models/user.model';
import { ProfileService } from '../profile.service';

@Component({
  selector: 'app-public-profile',
  imports: [],
  templateUrl: './public-profile.html',
  styleUrl: './public-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicProfile {
  private readonly profileService = inject(ProfileService);

  protected readonly profile = signal<PublicProfileModel | null>(null);
  protected readonly notFound = signal(false);

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    this.profileService.getPublicProfile(id).subscribe({
      next: (profile) => this.profile.set(profile),
      error: () => this.notFound.set(true),
    });
  }
}
