import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Currency, CreateTripRequest, PricingMode, Trip } from '../../../core/models/trip.model';
import { Vehicle } from '../../../core/models/vehicle.model';
import { VehicleService } from '../../profile/vehicle.service';
import { TripService } from '../trip.service';

interface PricingOption {
  value: PricingMode;
  label: string;
}

@Component({
  selector: 'app-trip-create',
  imports: [ReactiveFormsModule],
  templateUrl: './trip-create.html',
  styleUrl: './trip-create.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripCreate implements OnInit {
  private readonly tripService = inject(TripService);
  private readonly vehicleService = inject(VehicleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly editingId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  protected readonly loadingTrip = signal(!!this.editingId());

  protected readonly pricingOptions: PricingOption[] = [
    { value: 'SHARED_TOTAL', label: 'Shared total (split across passengers)' },
    { value: 'FIXED_PER_SEAT', label: 'Fixed per seat' },
  ];

  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly loadingVehicles = signal(true);
  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = new FormGroup({
    vehicleId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    concertId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    pricingMode: new FormControl<PricingMode>('SHARED_TOTAL', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    totalCost: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    currency: new FormControl<Currency>('EUR', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    minPassengers: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    maxPassengers: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    confirmationDeadline: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    departureAt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    roundTrip: new FormControl(false, { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
    stops: new FormArray<FormGroup>([]),
  });

  ngOnInit(): void {
    this.vehicleService.list().subscribe({
      next: (vehicles) => {
        this.vehicles.set(vehicles);
        this.loadingVehicles.set(false);
      },
      error: () => {
        this.loadingVehicles.set(false);
        this.serverError.set('Could not load your vehicles.');
      },
    });

    const id = this.editingId();
    if (id) {
      this.tripService.get(id).subscribe({
        next: (trip) => {
          this.prefill(trip);
          this.loadingTrip.set(false);
        },
        error: () => {
          this.loadingTrip.set(false);
          this.serverError.set('Could not load the trip to edit.');
        },
      });
    }
  }

  protected get stops(): FormArray<FormGroup> {
    return this.form.controls.stops;
  }

  protected addStop(): void {
    this.stops.push(
      new FormGroup({
        seq: new FormControl(this.stops.length + 1, { nonNullable: true }),
        place: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      }),
    );
  }

  /** Returns the place FormControl of a stop so the template stays type-safe. */
  protected placeControl(index: number): FormControl<string> {
    return this.stops.at(index).controls['place'] as FormControl<string>;
  }

  private prefill(trip: Trip): void {
    this.form.patchValue({
      vehicleId: trip.vehicleId,
      concertId: trip.concertId,
      pricingMode: trip.pricingMode,
      totalCost: trip.totalCost,
      currency: trip.currency,
      minPassengers: trip.minPassengers,
      maxPassengers: trip.maxPassengers,
      confirmationDeadline: toLocalInput(trip.confirmationDeadline),
      departureAt: toLocalInput(trip.departureAt),
      roundTrip: trip.roundTrip,
      notes: trip.notes ?? '',
    });
    this.stops.clear();
    for (const stop of [...trip.stops].sort((a, b) => a.seq - b.seq)) {
      this.stops.push(
        new FormGroup({
          seq: new FormControl(stop.seq, { nonNullable: true }),
          place: new FormControl(stop.place, {
            nonNullable: true,
            validators: [Validators.required],
          }),
        }),
      );
    }
  }

  protected removeStop(index: number): void {
    this.stops.removeAt(index);
    // Renumber the remaining stops so stop order stays stable.
    this.stops.controls.forEach((control, i) => control.get('seq')?.setValue(i + 1));
  }

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }
    this.pending.set(true);
    this.serverError.set(null);

    const raw = this.form.getRawValue();
    const stops = (raw.stops as Array<{ seq: number; place: string }>).map((stop) => ({
      seq: stop.seq,
      place: stop.place.trim(),
    }));
    const request: CreateTripRequest = {
      vehicleId: raw.vehicleId,
      concertId: raw.concertId,
      pricingMode: raw.pricingMode,
      totalCost: Number(raw.totalCost),
      currency: raw.currency,
      minPassengers: Number(raw.minPassengers),
      maxPassengers: Number(raw.maxPassengers),
      confirmationDeadline: raw.confirmationDeadline,
      departureAt: raw.departureAt,
      roundTrip: raw.roundTrip,
      ...(raw.notes?.trim() ? { notes: raw.notes.trim() } : {}),
      stops,
    };

    const save$ = this.editingId()
      ? this.tripService.update(this.editingId()!, request)
      : this.tripService.create(request);

    save$.subscribe({
      next: (trip) => {
        this.pending.set(false);
        this.router.navigate(['/trips', trip.id]);
      },
      error: () => {
        this.pending.set(false);
        this.serverError.set(
          this.editingId()
            ? 'Could not update the trip. Please check the values and try again.'
            : 'Could not create the trip. Please check the values and try again.',
        );
      },
    });
  }
}

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
