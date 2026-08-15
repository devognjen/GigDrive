import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CreateConcertRequest } from '../../../core/models/concert.model';
import { ConcertService } from '../concert.service';

const URL_PATTERN = /^https?:\/\/.+/;

@Component({
  selector: 'app-concert-create',
  imports: [ReactiveFormsModule],
  templateUrl: './concert-create.html',
  styleUrl: './concert-create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConcertCreate {
  private readonly concertService = inject(ConcertService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    artist: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    venue: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    startAt: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    genre: new FormControl('', { nonNullable: true }),
    imageUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(URL_PATTERN)],
    }),
    ticketUrl: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(URL_PATTERN)],
    }),
    lat: new FormControl<number | null>(null),
    lng: new FormControl<number | null>(null),
  });

  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      return;
    }
    this.pending.set(true);
    this.serverError.set(null);

    const { artist, title, venue, city, country, startAt, genre, imageUrl, ticketUrl, lat, lng } =
      this.form.getRawValue();
    const request: CreateConcertRequest = {
      artist,
      title,
      venue,
      city,
      country,
      // The datetime-local input yields local time without a zone; convert to ISO 8601.
      startAt: new Date(startAt).toISOString(),
      ...(genre.trim() ? { genre: genre.trim() } : {}),
      ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      ...(ticketUrl.trim() ? { ticketUrl: ticketUrl.trim() } : {}),
      ...(lat !== null ? { lat } : {}),
      ...(lng !== null ? { lng } : {}),
    };

    this.concertService.create(request).subscribe({
      next: (concert) => this.router.navigate(['/concerts', concert.id]),
      error: (_error: HttpErrorResponse) => {
        this.pending.set(false);
        this.serverError.set('Could not save the concert. Please try again.');
      },
    });
  }
}
