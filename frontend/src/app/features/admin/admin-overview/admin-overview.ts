import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

import { AdminStats } from '../../../core/models/admin.model';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-admin-overview',
  templateUrl: './admin-overview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOverview implements OnInit {
  private readonly adminService = inject(AdminService);

  protected readonly stats = signal<AdminStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load platform stats.');
        this.loading.set(false);
      },
    });
  }

  protected tripEntries(stats: AdminStats): { status: string; count: number }[] {
    return Object.entries(stats.tripsByStatus).map(([status, count]) => ({ status, count }));
  }

  protected bookingEntries(stats: AdminStats): { status: string; count: number }[] {
    return Object.entries(stats.bookingsByStatus).map(([status, count]) => ({
      status,
      count,
    }));
  }
}
