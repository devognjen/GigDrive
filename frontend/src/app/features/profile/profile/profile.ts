import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly authService = inject(AuthService);

  protected readonly form = new FormGroup({
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    phone: new FormControl('', { nonNullable: true }),
    emailNotifications: new FormControl(false, { nonNullable: true }),
  });

  protected readonly pending = signal(false);
  protected readonly saved = signal(false);
  protected readonly serverError = signal<string | null>(null);

  constructor() {
    const user = this.authService.currentUser();
    if (user) {
      this.form.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? '',
        emailNotifications: user.emailNotifications,
      });
    }
    // A new edit invalidates the previous save confirmation.
    this.form.valueChanges.subscribe(() => this.saved.set(false));
  }

  protected submit(): void {
    if (this.form.invalid || this.form.pristine || this.pending()) {
      return;
    }
    this.pending.set(true);
    this.saved.set(false);
    this.serverError.set(null);

    const { firstName, lastName, phone, emailNotifications } = this.form.getRawValue();
    this.authService
      .updateProfile({ firstName, lastName, phone: phone || undefined, emailNotifications })
      .subscribe({
        next: () => {
          this.pending.set(false);
          this.form.markAsPristine();
          this.saved.set(true);
        },
        error: () => {
          this.pending.set(false);
          this.serverError.set('Could not save your profile. Please try again.');
        },
      });
  }
}
