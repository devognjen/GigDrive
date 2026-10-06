import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShell {}
