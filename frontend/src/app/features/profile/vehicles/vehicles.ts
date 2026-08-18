import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Vehicle, VehicleRequest, VehicleType } from '../../../core/models/vehicle.model';
import { VehicleService } from '../vehicle.service';

interface VehicleTypeOption {
  value: VehicleType;
  label: string;
}

@Component({
  selector: 'app-vehicles',
  imports: [ReactiveFormsModule],
  templateUrl: './vehicles.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vehicles implements OnInit {
  private readonly vehicleService = inject(VehicleService);

  protected readonly typeOptions: VehicleTypeOption[] = [
    { value: 'CAR', label: 'Car' },
    { value: 'VAN', label: 'Van' },
    { value: 'MINIBUS', label: 'Minibus' },
  ];

  protected readonly form = new FormGroup({
    type: new FormControl<VehicleType>('CAR', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    make: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    model: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    seats: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    notes: new FormControl('', { nonNullable: true }),
  });

  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly loading = signal(true);
  protected readonly pending = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly serverError = signal<string | null>(null);

  ngOnInit(): void {
    this.vehicleService.list().subscribe({
      next: (vehicles) => {
        this.vehicles.set(vehicles);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.serverError.set('Could not load your vehicles.');
      },
    });
  }

  protected edit(vehicle: Vehicle): void {
    this.editingId.set(vehicle.id);
    this.serverError.set(null);
    this.form.setValue({
      type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
      seats: vehicle.seats,
      notes: vehicle.notes ?? '',
    });
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.serverError.set(null);
    this.form.reset({ type: 'CAR', make: '', model: '', seats: 1, notes: '' });
  }

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      return;
    }
    this.pending.set(true);
    this.serverError.set(null);

    const { type, make, model, seats, notes } = this.form.getRawValue();
    const request: VehicleRequest = {
      type,
      make: make.trim(),
      model: model.trim(),
      seats: Number(seats),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    const id = this.editingId();
    const save$ = id
      ? this.vehicleService.update(id, request)
      : this.vehicleService.create(request);
    save$.subscribe({
      next: (vehicle) => {
        this.pending.set(false);
        this.vehicles.update((list) =>
          id ? list.map((v) => (v.id === id ? vehicle : v)) : [...list, vehicle],
        );
        this.resetForm();
      },
      error: () => {
        this.pending.set(false);
        this.serverError.set('Could not save the vehicle. Please try again.');
      },
    });
  }

  protected delete(vehicle: Vehicle): void {
    if (!window.confirm(`Delete ${vehicle.make} ${vehicle.model}?`)) {
      return;
    }
    this.serverError.set(null);
    this.vehicleService.delete(vehicle.id).subscribe({
      next: () => this.vehicles.update((list) => list.filter((v) => v.id !== vehicle.id)),
      error: (error: HttpErrorResponse) => {
        // 409: the backend blocks deleting a vehicle that trips reference.
        this.serverError.set(
          error.status === 409
            ? 'This vehicle is used by existing trips and cannot be deleted.'
            : 'Could not delete the vehicle. Please try again.',
        );
      },
    });
  }
}
