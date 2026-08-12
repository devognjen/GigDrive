# Feature: Driver & Passenger Dashboards

- **Tier:** 0 (MVP)
- **PRD references:** §5.1 (dashboards: earnings aggregation, booking statuses, paid flag), §12 (map/reduce compliance demo), §13 milestone M10
- **Depends on:** 05-trips, 06-bookings, 09-reviews (driver rating display)

## Overview

Per-user home bases: the driver dashboard aggregates trips organized, incoming booking requests, and earnings; the passenger dashboard lists own bookings with statuses and live prices. Roles are emergent — one user can use both dashboards.

## Scope

### Driver dashboard
- Own trips (`GET /trips/mine`) with status, confirmed seats, live per-person price.
- Incoming booking requests with accept/reject actions (see 06-bookings).
- Earnings aggregation across confirmed bookings (map/reduce demo per §12).
- Paid flags management (FR-BOOK-04).

### Passenger dashboard
- Own bookings (`GET /bookings/mine`) with trip info, status (PENDING/CONFIRMED/REJECTED/CANCELLED_BY_PASSENGER), live price, paid flag.
- Cancel action on own bookings (see 06-bookings).

## Implementation notes

- Container/presentational split: container pages fetch via NgRx effects; presentational booking-list and trip-card components use @Input/@Output.
- NgRx `@ngrx/entity` adapters for trips & bookings collections (§12 compliance).

## Acceptance criteria

- Driver sees own trips, pending requests, and aggregated earnings; can accept/reject and toggle paid.
- Passenger sees own bookings with accurate statuses and current per-person price; can cancel.
- Data flows through NgRx store/effects with entity adapters.
- Empty states handled (no trips / no bookings yet).
- Unit tests cover earnings aggregation and dashboard selectors.
