import { Routes } from '@angular/router';

import { TripCreate } from './trip-create/trip-create';
import { TripDetails } from './trip-details/trip-details';
import { TripList } from './trip-list/trip-list';

export default [
  { path: '', component: TripList },
  { path: 'new', component: TripCreate },
  { path: ':id', component: TripDetails },
  { path: ':id/edit', component: TripCreate },
] satisfies Routes;
