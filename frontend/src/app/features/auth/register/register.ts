import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    phone: new FormControl('', { nonNullable: true }),
  });

  protected readonly pending = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      return;
    }
    this.pending.set(true);
    this.serverError.set(null);

    const { firstName, lastName, email, password, phone } = this.form.getRawValue();
    this.authService
      .register({ firstName, lastName, email, password, ...(phone ? { phone } : {}) })
      .subscribe({
        next: () => this.router.navigate(['/concerts']),
        error: (error: HttpErrorResponse) => {
          this.pending.set(false);
          this.serverError.set(
            error.status === 409
              ? 'This email is already registered'
              : 'Something went wrong. Please try again.',
          );
        },
      });
  }
}
