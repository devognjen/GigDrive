import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ConcertDetails as ConcertDetailsData } from '../../../core/models/concert.model';
import { ConcertService } from '../concert.service';

@Component({
  selector: 'app-concert-details',
  imports: [DatePipe, RouterLink],
  templateUrl: './concert-details.html',
  styleUrl: './concert-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConcertDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly concertService = inject(ConcertService);

  protected readonly details = signal<ConcertDetailsData | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }
    this.concertService.getDetails(id).subscribe({
      next: (details) => {
        this.details.set(details);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        if (error.status === 404) {
          this.notFound.set(true);
        }
      },
    });
  }
}
