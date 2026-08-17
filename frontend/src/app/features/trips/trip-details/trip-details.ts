import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { FeaturesService } from '../../../core/services/features.service';
import { Trip } from '../../../core/models/trip.model';
import { BookingService } from '../../bookings/booking.service';
import { TripChat } from '../../chat/trip-chat/trip-chat';
import { TripService } from '../trip.service';

@Component({
  selector: 'app-trip-details',
  imports: [DatePipe, RouterLink, ReactiveFormsModule, TripChat],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly tripService = inject(TripService);
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly featuresService = inject(FeaturesService);

  protected readonly trip = signal<Trip | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly actionError = signal<string | null>(null);
  protected readonly actionPending = signal(false);
  protected readonly bookingError = signal<string | null>(null);
  protected readonly bookingPending = signal(false);
  protected readonly bookingDone = signal(false);
  protected readonly isConfirmedPassenger = signal(false);

  private membershipRequested = false;

  protected readonly seats = new FormControl(1, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1)],
  });

  protected readonly isDriver = computed(() => {
    const currentUser = this.authService.currentUser();
    const currentTrip = this.trip();
    return Boolean(currentUser && currentTrip && currentUser.id === currentTrip.driverId);
  });

  protected readonly isBookable = computed(() => {
    const currentTrip = this.trip();
    const isDriver = this.isDriver();
    return Boolean(
      currentTrip &&
      !isDriver &&
      (currentTrip.status === 'OPEN' ||
        currentTrip.status === 'READY' ||
        currentTrip.status === 'FULL'),
    );
  });

  protected readonly showChat = computed(
    () =>
      this.featuresService.chatEnabled() &&
      (this.isDriver() || this.isConfirmedPassenger()),
  );

  constructor() {
    this.featuresService.load().subscribe(() => this.maybeLoadMembership());

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
        this.maybeLoadMembership();
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        if (error.status === 404) {
          this.notFound.set(true);
        }
      },
    });
  }

  private maybeLoadMembership(): void {
    if (this.membershipRequested) {
      return;
    }
    const trip = this.trip();
    if (!trip || this.featuresService.features() === null) {
      return;
    }
    this.membershipRequested = true;
    if (!this.featuresService.chatEnabled() || this.isDriver()) {
      return;
    }
    this.bookingService.listMine().subscribe({
      next: (bookings) => {
        this.isConfirmedPassenger.set(
          bookings.some((booking) => booking.tripId === trip.id && booking.status === 'CONFIRMED'),
        );
      },
    });
  }

  protected formatPrice(minorUnits: number): string {
    return `${(minorUnits / 100).toFixed(2)} €`;
  }

  protected requestSeats(): void {
    const trip = this.trip();
    const seats = this.seats.value;
    if (!trip || seats < 1 || this.bookingPending()) {
      return;
    }
    this.bookingPending.set(true);
    this.bookingError.set(null);
    this.bookingService.request(trip.id, { seats }).subscribe({
      next: () => {
        this.bookingPending.set(false);
        this.bookingDone.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.bookingPending.set(false);
        this.bookingError.set(
          error.status === 409
            ? 'Not enough seats left for this trip.'
            : 'Could not request seats.',
        );
      },
    });
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
