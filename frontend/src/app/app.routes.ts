import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { dashboardStoreProviders } from './features/dashboards/store/dashboard-store.providers';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'concerts' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes'),
  },
  {
    path: 'concerts',
    loadChildren: () => import('./features/concerts/concerts.routes'),
  },
  {
    path: 'trips',
    canActivate: [authGuard],
    loadChildren: () => import('./features/trips/trips.routes'),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    providers: dashboardStoreProviders,
    loadChildren: () => import('./features/dashboards/dashboards.routes'),
  },
  { path: 'bookings/driver', redirectTo: '/dashboard/driver' },
  { path: 'bookings', redirectTo: '/dashboard/passenger' },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes'),
  },
  {
    path: 'users/:id',
    loadComponent: () =>
      import('./features/profile/public-profile/public-profile').then((m) => m.PublicProfile),
  },
  { path: '**', redirectTo: 'concerts' },
];
