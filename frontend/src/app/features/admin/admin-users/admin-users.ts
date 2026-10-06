import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminUser } from '../../../core/models/admin.model';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../admin.service';

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);

  protected readonly query = signal('');
  protected readonly users = signal<AdminUser[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pendingId = signal<string | null>(null);
  protected readonly currentUserId = () => this.authService.currentUser()?.id ?? null;

  ngOnInit(): void {
    this.reload();
  }

  protected search(): void {
    this.reload();
  }

  protected toggleDisabled(user: AdminUser): void {
    this.pendingId.set(user.id);
    this.error.set(null);
    const request = user.disabledAt
      ? this.adminService.enableUser(user.id)
      : this.adminService.disableUser(user.id);
    request.subscribe({
      next: (updated) => {
        this.users.update((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
        this.pendingId.set(null);
      },
      error: () => {
        this.error.set('Could not update that account.');
        this.pendingId.set(null);
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.adminService.listUsers(this.query()).subscribe({
      next: (result) => {
        this.users.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load users.');
        this.loading.set(false);
      },
    });
  }
}
