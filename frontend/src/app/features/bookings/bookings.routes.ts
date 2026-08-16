import { Routes } from '@angular/router';
import { DriverBookings } from './driver-bookings/driver-bookings';
import { MyBookings } from './my-bookings/my-bookings';

export default [
  { path: '', component: MyBookings },
  { path: 'driver', component: DriverBookings },
] satisfies Routes;
