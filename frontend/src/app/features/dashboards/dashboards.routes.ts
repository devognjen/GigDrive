import { Routes } from '@angular/router';

import { DriverDashboard } from './driver-dashboard/driver-dashboard';
import { PassengerDashboard } from './passenger-dashboard/passenger-dashboard';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'passenger' },
  { path: 'driver', component: DriverDashboard },
  { path: 'passenger', component: PassengerDashboard },
] satisfies Routes;
