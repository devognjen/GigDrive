import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

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
    path: 'bookings',
    canActivate: [authGuard],
    loadChildren: () => import('./features/bookings/bookings.routes'),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes'),
  },
  { path: '**', redirectTo: 'concerts' },
];
