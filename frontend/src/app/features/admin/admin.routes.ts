import { Routes } from '@angular/router';

import { AdminConcerts } from './admin-concerts/admin-concerts';
import { AdminOverview } from './admin-overview/admin-overview';
import { AdminShell } from './admin-shell/admin-shell';
import { AdminTrips } from './admin-trips/admin-trips';
import { AdminUsers } from './admin-users/admin-users';

export default [
  {
    path: '',
    component: AdminShell,
    children: [
      { path: '', component: AdminOverview },
      { path: 'users', component: AdminUsers },
      { path: 'concerts', component: AdminConcerts },
      { path: 'trips', component: AdminTrips },
    ],
  },
] satisfies Routes;
