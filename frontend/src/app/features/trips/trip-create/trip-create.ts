import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Concert } from '../../../core/models/concert.model';
import {
  CreateTripRequest,
  CreateTripStop,
  Currency,
  LivePrice,
  PricingMode,
  Trip,
} from '../../../core/models/trip.model';
import { Vehicle } from '../../../core/models/vehicle.model';
import { shiftLocalInput, toLocalInput } from '../../../core/utils/local-datetime';
import { formatMoney, fromMinorUnits, toMinorUnits } from '../../../core/utils/money';
import { calculateLivePrice } from '../../../core/utils/pricing';
import { ConcertPicker } from '../../concerts/concert-picker/concert-picker';
import { VehicleService } from '../../profile/vehicle.service';
import { TripService } from '../trip.service';
import { scheduleOrderValidator, suggestSchedule } from './trip-schedule';

interface PricingOption {
  value: PricingMode;
  label: string;
}

/** Snapshot used to render the live per-person preview under the amount field. */
interface PricePreview {
  mode: PricingMode;
  min: number;
  max: number;
  perPerson: string;
  lowerBound: string;
  upperBound: string;
}

type StopFormGroup = FormGroup<{
  seq: FormControl<number>;
  place: FormControl<string>;
  lat: FormControl<number | null>;
  lng: FormControl<number | null>;
}>;

@Component({
  selector: 'app-trip-create',
  imports: [ReactiveFormsModule, ConcertPicker],
  templateUrl: './trip-create.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripCreate implements OnInit {
  private readonly tripService = inject(TripService);
  private readonly vehicleService = inject(VehicleService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly editingId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  protected readonly loadingTrip = signal(!!this.editingId());
  protected readonly selectedConcert = signal<Concert | null>(null);

  protected readonly pricingOptions: PricingOption[] = [
    { value: 'SHARED_TOTAL', label: 'Shared total' },
    { value: 'FIXED_PER_SEAT', label: 'Fixed per seat' },
  ];

  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly loadingVehicles = signal(true);
  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);

  /** Last applied vehicle seat count, used to detect "follow the vehicle" vs a custom max. */
  private previousVehicleSeats = 0;

  protected readonly form = new FormGroup(
    {
      vehicleId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      concertId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      pricingMode: new FormControl<PricingMode>('SHARED_TOTAL', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      totalCost: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)],
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
      stops: new FormArray<StopFormGroup>([]),
    },
    {
      validators: [
        scheduleOrderValidator(() => this.selectedConcert()?.startAt ?? null),
        capacityValidator(
          (vehicleId) => this.vehicles().find((vehicle) => vehicle.id === vehicleId)?.seats ?? null,
        ),
      ],
    },
  );

  ngOnInit(): void {
    const queryConcertId = this.route.snapshot.queryParamMap.get('concertId');
    if (queryConcertId && !this.editingId()) {
      this.form.controls.concertId.setValue(queryConcertId);
    }

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

  protected get stops(): FormArray<StopFormGroup> {
    return this.form.controls.stops;
  }

  protected addStop(): void {
    this.stops.push(this.stopGroup(this.stops.length + 1));
  }

  /** Returns the place FormControl of a stop so the template stays type-safe. */
  protected placeControl(index: number): FormControl<string> {
    return this.stops.at(index).controls.place;
  }

  protected latControl(index: number): FormControl<number | null> {
    return this.stops.at(index).controls.lat;
  }

  protected lngControl(index: number): FormControl<number | null> {
    return this.stops.at(index).controls.lng;
  }

  /** Inclusive max for the confirmation deadline picker. */
  protected deadlineMax(): string {
    const departureCap = shiftLocalInput(this.form.controls.departureAt.value, -1);
    const concertCap = this.concertStartLocal()
      ? shiftLocalInput(this.concertStartLocal(), -1)
      : '';
    return earliestLocal(departureCap, concertCap);
  }

  /** Inclusive min for the departure picker. */
  protected departureMin(): string {
    return shiftLocalInput(this.form.controls.confirmationDeadline.value, 1);
  }

  /** Inclusive max for the departure picker (concert start, if known). */
  protected departureMax(): string {
    return this.concertStartLocal();
  }

  protected selectedVehicle(): Vehicle | undefined {
    const id = this.form.controls.vehicleId.value;
    return this.vehicles().find((vehicle) => vehicle.id === id);
  }

  /** Seat cap of the currently selected vehicle, or null if none is chosen. */
  protected selectedVehicleSeats(): number | null {
    return this.selectedVehicle()?.seats ?? null;
  }

  /** Defaults or clamps seats offered when the driver picks a vehicle. */
  protected onVehicleChange(): void {
    this.applyVehicleCapacity();
    this.form.updateValueAndValidity();
  }

  protected onConcertChange(concert: Concert | null): void {
    this.selectedConcert.set(concert);
    if (concert && this.datesAreEmpty()) {
      const suggested = suggestSchedule(concert.startAt);
      if (suggested) {
        this.form.patchValue(suggested);
      }
    }
    this.form.updateValueAndValidity();
  }

  /** Live per-person copy for the pricing preview, or null when values are incomplete. */
  protected pricePreview(): PricePreview | null {
    const mode = this.form.controls.pricingMode.value;
    const major = Number(this.form.controls.totalCost.value);
    const min = Number(this.form.controls.minPassengers.value);
    const max = Number(this.form.controls.maxPassengers.value);
    const currency = this.form.controls.currency.value;
    if (!Number.isFinite(major) || major < 0.01 || min < 1 || max < 1 || min > max) {
      return null;
    }
    const price: LivePrice = calculateLivePrice(mode, toMinorUnits(major), min, max);
    const format = (minorUnits: number) => formatMoney(minorUnits, currency);
    return {
      mode,
      min,
      max,
      perPerson: format(price.perPerson),
      lowerBound: format(price.lowerBound),
      upperBound: format(price.upperBound),
    };
  }

  private concertStartLocal(): string {
    const startAt = this.selectedConcert()?.startAt;
    return startAt ? toLocalInput(startAt) : '';
  }

  private datesAreEmpty(): boolean {
    return !this.form.controls.confirmationDeadline.value && !this.form.controls.departureAt.value;
  }

  private applyVehicleCapacity(): void {
    const seats = this.selectedVehicleSeats();
    if (seats === null) {
      return;
    }
    const maxCtrl = this.form.controls.maxPassengers;
    const minCtrl = this.form.controls.minPassengers;
    const previousSeats = this.previousVehicleSeats;
    this.previousVehicleSeats = seats;

    if (maxCtrl.value > seats) {
      maxCtrl.setValue(seats);
    } else if (!this.editingId() && (maxCtrl.pristine || maxCtrl.value === previousSeats)) {
      maxCtrl.setValue(seats);
    }
    if (minCtrl.value > maxCtrl.value) {
      minCtrl.setValue(maxCtrl.value);
    }
  }

  private stopGroup(
    seq: number,
    place = '',
    lat: number | null = null,
    lng: number | null = null,
  ): StopFormGroup {
    return new FormGroup({
      seq: new FormControl(seq, { nonNullable: true }),
      place: new FormControl(place, { nonNullable: true, validators: [Validators.required] }),
      lat: new FormControl<number | null>(lat),
      lng: new FormControl<number | null>(lng),
    });
  }

  private prefill(trip: Trip): void {
    this.form.patchValue({
      vehicleId: trip.vehicleId,
      concertId: trip.concertId,
      pricingMode: trip.pricingMode,
      totalCost: fromMinorUnits(trip.totalCost),
      currency: trip.currency,
      minPassengers: trip.minPassengers,
      maxPassengers: trip.maxPassengers,
      confirmationDeadline: toLocalInput(trip.confirmationDeadline),
      departureAt: toLocalInput(trip.departureAt),
      roundTrip: trip.roundTrip,
      notes: trip.notes ?? '',
    });
    this.previousVehicleSeats = this.selectedVehicle()?.seats ?? trip.maxPassengers;
    this.stops.clear();
    for (const stop of [...trip.stops].sort((a, b) => a.seq - b.seq)) {
      this.stops.push(this.stopGroup(stop.seq, stop.place, stop.lat, stop.lng));
    }
  }

  protected removeStop(index: number): void {
    this.stops.removeAt(index);
    // Renumber the remaining stops so stop order stays stable.
    this.stops.controls.forEach((control, i) => control.controls.seq.setValue(i + 1));
  }

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }
    this.pending.set(true);
    this.serverError.set(null);

    const raw = this.form.getRawValue();
    const stops: CreateTripStop[] = raw.stops.map((stop) => ({
      seq: stop.seq,
      place: stop.place.trim(),
      ...(stop.lat !== null ? { lat: Number(stop.lat) } : {}),
      ...(stop.lng !== null ? { lng: Number(stop.lng) } : {}),
    }));
    const request: CreateTripRequest = {
      vehicleId: raw.vehicleId,
      concertId: raw.concertId,
      pricingMode: raw.pricingMode,
      totalCost: toMinorUnits(Number(raw.totalCost)),
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

function earliestLocal(a: string, b: string): string {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }
  return a <= b ? a : b;
}

/** Form-level check: min ≤ max ≤ vehicle.seats (FR-TRIP-02). */
function capacityValidator(seatsForVehicle: (vehicleId: string) => number | null): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const min = Number(group.get('minPassengers')?.value);
    const max = Number(group.get('maxPassengers')?.value);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return null;
    }
    const errors: ValidationErrors = {};
    if (min > max) {
      errors['minExceedsMax'] = true;
    }
    const vehicleId = String(group.get('vehicleId')?.value ?? '');
    const seats = vehicleId ? seatsForVehicle(vehicleId) : null;
    if (seats !== null && max > seats) {
      errors['maxExceedsSeats'] = true;
    }
    return Object.keys(errors).length > 0 ? errors : null;
  };
}
