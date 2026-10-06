import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Trip, TripStatus } from '../../../core/models/trip.model';
import { AdminService } from '../admin.service';

const STATUSES: Array<TripStatus | ''> = [
  '',
  'OPEN',
  'FULL',
  'READY',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
];

@Component({
  selector: 'app-admin-trips',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './admin-trips.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTrips implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly statuses = STATUSES;
  protected readonly status = signal<TripStatus | ''>('');
  protected readonly trips = signal<Trip[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pendingId = signal<string | null>(null);

  ngOnInit(): void {
    this.reload();
  }

  protected onStatusChange(value: string): void {
    this.status.set((value || '') as TripStatus | '');
    this.reload();
  }

  protected canCancel(trip: Trip): boolean {
    return trip.status !== 'CANCELLED' && trip.status !== 'COMPLETED';
  }

  protected cancel(trip: Trip): void {
    this.pendingId.set(trip.id);
    this.error.set(null);
    this.adminService.cancelTrip(trip.id).subscribe({
      next: (updated) => {
        this.trips.update((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
        this.pendingId.set(null);
      },
      error: () => {
        this.error.set('Could not cancel that trip.');
        this.pendingId.set(null);
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.status();
    this.adminService.listTrips(status === '' ? undefined : status).subscribe({
      next: (trips) => {
        this.trips.set(trips);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load trips.');
        this.loading.set(false);
      },
    });
  }
}
