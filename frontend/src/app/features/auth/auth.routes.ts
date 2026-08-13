import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';

export default [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
] satisfies Routes;
