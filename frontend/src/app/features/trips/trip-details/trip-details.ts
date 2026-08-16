import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { Trip } from '../../../core/models/trip.model';
import { TripService } from '../trip.service';

@Component({
  selector: 'app-trip-details',
  imports: [DatePipe, RouterLink],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly tripService = inject(TripService);
  private readonly authService = inject(AuthService);

  protected readonly trip = signal<Trip | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionPending = signal(false);

  protected readonly isDriver = computed(() => {
    const currentUser = this.authService.currentUser();
    const currentTrip = this.trip();
    return Boolean(currentUser && currentTrip && currentUser.id === currentTrip.driverId);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.notFound.set(true);
      return;
    }
    this.tripService.get(id).subscribe({
      next: (trip) => {
        this.trip.set(trip);
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

  protected formatPrice(minorUnits: number): string {
    return `${(minorUnits / 100).toFixed(2)} €`;
  }

  protected confirm(): void {
    const trip = this.trip();
    if (!trip || this.actionPending()) {
      return;
    }
    this.actionPending.set(true);
    this.actionError.set(null);
    this.tripService.confirm(trip.id).subscribe({
      next: (updated) => {
        this.trip.set(updated);
        this.actionPending.set(false);
      },
      error: () => {
        this.actionPending.set(false);
        this.actionError.set('Could not confirm the trip.');
      },
    });
  }

  protected cancel(): void {
    const trip = this.trip();
    if (!trip || this.actionPending()) {
      return;
    }
    if (!window.confirm('Cancel this trip?')) {
      return;
    }
    this.actionPending.set(true);
    this.actionError.set(null);
    this.tripService.cancel(trip.id).subscribe({
      next: (updated) => {
        this.trip.set(updated);
        this.actionPending.set(false);
      },
      error: () => {
        this.actionPending.set(false);
        this.actionError.set('Could not cancel the trip.');
      },
    });
  }
}
