import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth-guard';
import { ConcertCreate } from './concert-create/concert-create';
import { ConcertDetails } from './concert-details/concert-details';
import { ConcertSearch } from './concert-search/concert-search';

export default [
  { path: '', component: ConcertSearch },
  { path: 'new', component: ConcertCreate, canActivate: [authGuard] },
  { path: ':id', component: ConcertDetails },
] satisfies Routes;
