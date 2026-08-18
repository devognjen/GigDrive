import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { FeaturesService } from '../../../core/services/features.service';
import { Trip } from '../../../core/models/trip.model';
import { WaitlistEntry } from '../../../core/models/waitlist.model';
import {
  fallbackManifestFilename,
  filenameFromContentDisposition,
  triggerBrowserDownload,
} from '../../../core/utils/download';
import { BookingService } from '../../bookings/booking.service';
import { TripChat } from '../../chat/trip-chat/trip-chat';
import { WaitlistService } from '../../waitlist/waitlist.service';
import { PickupMap } from '../pickup-map/pickup-map';
import { TripService } from '../trip.service';

@Component({
  selector: 'app-trip-details',
  imports: [DatePipe, RouterLink, ReactiveFormsModule, PickupMap, TripChat],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly tripService = inject(TripService);
  private readonly bookingService = inject(BookingService);
  private readonly waitlistService = inject(WaitlistService);
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
  protected readonly waitlistEntry = signal<WaitlistEntry | null>(null);
  protected readonly waitlistError = signal<string | null>(null);
  protected readonly waitlistPending = signal(false);

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

  protected readonly canRequestBooking = computed(() => {
    const currentTrip = this.trip();
    const isDriver = this.isDriver();
    return Boolean(
      currentTrip &&
      !isDriver &&
      (currentTrip.status === 'OPEN' || currentTrip.status === 'READY'),
    );
  });

  protected readonly canJoinWaitlist = computed(() => {
    const currentTrip = this.trip();
    return Boolean(currentTrip && !this.isDriver() && currentTrip.status === 'FULL');
  });

  protected readonly showChat = computed(
    () =>
      this.featuresService.chatEnabled() &&
      (this.isDriver() || this.isConfirmedPassenger()),
  );

  protected readonly canExportCsv = computed(() => {
    const currentTrip = this.trip();
    return Boolean(this.isDriver() && currentTrip && currentTrip.confirmedSeats > 0);
  });

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
        this.loadWaitlistMembership();
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

  private loadWaitlistMembership(): void {
    const trip = this.trip();
    const user = this.authService.currentUser();
    if (!trip || trip.status !== 'FULL' || !user || user.id === trip.driverId) {
      return;
    }
    this.waitlistService.listMine().subscribe({
      next: (entries) => {
        this.waitlistEntry.set(entries.find((entry) => entry.tripId === trip.id) ?? null);
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

  protected joinWaitlist(): void {
    const trip = this.trip();
    const seats = this.seats.value;
    if (!trip || seats < 1 || this.waitlistPending()) {
      return;
    }
    this.waitlistPending.set(true);
    this.waitlistError.set(null);
    this.waitlistService.join(trip.id, { seats }).subscribe({
      next: (entry) => {
        this.waitlistPending.set(false);
        this.waitlistEntry.set(entry);
      },
      error: (error: HttpErrorResponse) => {
        this.waitlistPending.set(false);
        this.waitlistError.set(
          error.status === 409
            ? 'Could not join the waitlist for this trip.'
            : 'Could not join the waitlist.',
        );
      },
    });
  }

  protected leaveWaitlist(): void {
    const trip = this.trip();
    if (!trip || this.waitlistPending()) {
      return;
    }
    this.waitlistPending.set(true);
    this.waitlistError.set(null);
    this.waitlistService.leave(trip.id).subscribe({
      next: () => {
        this.waitlistPending.set(false);
        this.waitlistEntry.set(null);
      },
      error: () => {
        this.waitlistPending.set(false);
        this.waitlistError.set('Could not leave the waitlist.');
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

  protected exportCsv(): void {
    const trip = this.trip();
    if (!trip || this.actionPending()) {
      return;
    }
    this.actionPending.set(true);
    this.actionError.set(null);
    this.tripService.exportManifest(trip.id).subscribe({
      next: (response) => {
        this.actionPending.set(false);
        const blob = response.body;
        if (!blob) {
          return;
        }
        triggerBrowserDownload(
          blob,
          filenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
            fallbackManifestFilename(trip),
        );
      },
      error: () => {
        this.actionPending.set(false);
        this.actionError.set('Could not export the passenger manifest.');
      },
    });
  }
}
