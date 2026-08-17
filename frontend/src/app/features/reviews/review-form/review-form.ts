import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

/**
 * Presentational 1–5 + comment form used on eligible past trips.
 */
@Component({
  selector: 'app-review-form',
  imports: [ReactiveFormsModule],
  templateUrl: './review-form.html',
  styleUrl: './review-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewForm {
  @Input() pending = false;
  @Output() submitted = new EventEmitter<{ rating: number; comment: string }>();

  protected readonly ratings = [1, 2, 3, 4, 5];

  protected readonly form = new FormGroup({
    rating: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(5)],
    }),
    comment: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1000)],
    }),
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { rating, comment } = this.form.getRawValue();
    this.submitted.emit({ rating: Number(rating), comment: comment.trim() });
  }
}
