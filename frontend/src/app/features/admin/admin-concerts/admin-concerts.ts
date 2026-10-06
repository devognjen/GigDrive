import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Concert } from '../../../core/models/concert.model';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-admin-concerts',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-concerts.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminConcerts implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly filter = signal<'all' | 'submitted' | 'hidden'>('submitted');
  protected readonly concerts = signal<Concert[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pendingId = signal<string | null>(null);

  ngOnInit(): void {
    this.reload();
  }

  protected onFilterChange(value: string): void {
    this.filter.set(value as 'all' | 'submitted' | 'hidden');
    this.reload();
  }

  protected toggleHidden(concert: Concert): void {
    this.pendingId.set(concert.id);
    this.error.set(null);
    const request = concert.hidden
      ? this.adminService.unhideConcert(concert.id)
      : this.adminService.hideConcert(concert.id);
    request.subscribe({
      next: (updated) => {
        this.concerts.update((rows) =>
          rows.map((row) => (row.id === updated.id ? updated : row)),
        );
        this.pendingId.set(null);
      },
      error: () => {
        this.error.set('Could not update that concert.');
        this.pendingId.set(null);
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const filters =
      this.filter() === 'submitted'
        ? { userSubmitted: true }
        : this.filter() === 'hidden'
          ? { hidden: true }
          : {};
    this.adminService.listConcerts(filters).subscribe({
      next: (concerts) => {
        this.concerts.set(concerts);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load concerts.');
        this.loading.set(false);
      },
    });
  }
}
