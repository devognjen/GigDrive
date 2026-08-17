import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, zip } from 'rxjs';

import {
  ConcertDetails as ConcertDetailsData,
  ConcertWeather,
} from '../../../core/models/concert.model';
import { ConcertService } from '../concert.service';
import { WeatherWidget } from '../weather-widget/weather-widget';

@Component({
  selector: 'app-concert-details',
  imports: [DatePipe, RouterLink, WeatherWidget],
  templateUrl: './concert-details.html',
  styleUrl: './concert-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConcertDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly concertService = inject(ConcertService);

  protected readonly details = signal<ConcertDetailsData | null>(null);
  protected readonly weather = signal<ConcertWeather | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }
    // zip is the course combinational-operator demo (PRD §12): event details
    // and weather are requested in parallel; weather failures emit null so
    // the rest of the page still renders.
    zip(
      this.concertService.getDetails(id),
      this.concertService.getWeather(id).pipe(catchError(() => of<ConcertWeather | null>(null))),
    ).subscribe({
      next: ([details, weather]) => {
        this.details.set(details);
        this.weather.set(weather);
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
