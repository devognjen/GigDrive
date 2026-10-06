# Feature: Admin Dashboard

- **Tier:** Beyond PRD (post-MVP operator console)
- **PRD references:** §3 originally excluded an admin role; this feature **adds** an `isAdmin` overlay without changing emergent Driver/Passenger roles. Payments and review moderation stay out of scope (§5.4).
- **Depends on:** 02-auth-and-users, 03-concerts, 05-trips, 06-bookings, 08-dashboards

## Overview

A platform operator console for the demo/defense: KPIs, a user directory with disable/enable, soft-hide of user-submitted concerts, and force-cancel of trips. Admin is a **privilege on a registered user**, not a registration role. Anyone can still drive and ride; only seeded (or otherwise flagged) operators see `/admin`.

## Functional requirements

- **FR-ADMIN-01:** Authenticated users with `isAdmin` can open the admin console; others receive 403 from `/admin/*` and are redirected away from `/admin` in the UI.
- **FR-ADMIN-02:** Overview shows platform KPIs: user count; concerts (total, cached, user-submitted, hidden); trips by status; bookings by status; review count.
- **FR-ADMIN-03:** Operators can search/list users (name, email, createdAt, admin flag, disabled). Disable/enable sets `disabledAt`; disabled users cannot log in and existing JWTs fail on the next request. Cannot disable self or the last remaining admin. No UI to grant admin.
- **FR-ADMIN-04:** Operators can list concerts (filter user-submitted / hidden) and hide/unhide. Hidden concerts are omitted from public search, upcoming picker, and filter-options. Concert details remain available so existing trip pages do not break. No hard delete.
- **FR-ADMIN-05:** Operators can list all trips (including CANCELLED/COMPLETED), filter by status, and force-cancel using the same trip state machine and notification seam as a driver cancel.
- **FR-ADMIN-06:** Registration never sets `isAdmin`. Demo seed includes `admin@gigdrive.demo`.

## Scope

### Backend (NestJS)

- Migration: `users.isAdmin`, `users.disabledAt`, `concerts.hidden`.
- `JwtStrategy` / login reject disabled accounts. `UserDto` exposes `isAdmin`.
- `admin` module with `AdminGuard` (403 for authenticated non-admins).
- Thin admin endpoints; concert hide and user disable live on owning services; trip cancel delegates to `TripsService.cancel`.
- DTOs + class-validator; entities never returned from controllers.

### Frontend (Angular)

- Lazy `/admin` routes behind `authGuard` + `adminGuard`.
- Overview + Users / Concerts / Trips lists (child routes or tabs).
- `AdminService` (signals/HTTP, not a new NgRx slice).
- Shell nav “Admin” only when `currentUser.isAdmin`.
- Tailwind utilities only.

## Data model

- `user`: existing fields + `isAdmin` (boolean, default false) + `disabledAt` (timestamptz, nullable).
- `concert`: existing fields + `hidden` (boolean, default false).

## API endpoints

- `GET /admin/stats`
- `GET /admin/users?q&page`
- `POST /admin/users/:id/disable`
- `POST /admin/users/:id/enable`
- `GET /admin/concerts?userSubmitted&hidden`
- `POST /admin/concerts/:id/hide`
- `POST /admin/concerts/:id/unhide`
- `GET /admin/trips?status`
- `POST /admin/trips/:id/cancel`

## Out of scope

Payment tooling, review delete/edit, chat/Signal/mail inboxes, editing other people’s vehicles or trips as a CMS, promoting users to admin in the UI.

## Acceptance criteria

- Non-admins cannot call admin APIs (403) or stay on `/admin`.
- Disabled users cannot authenticate; `/auth/me` with their token is 401.
- Hidden concerts disappear from search, upcoming, and filter-options; trip details for existing offers still resolve the concert.
- Force-cancel uses `TripsService.cancel` and emails the crew as a driver cancel would.
- Seeded `admin@gigdrive.demo` can use the console; demo driver cannot.
- Unit tests cover AdminGuard, stats aggregation, disable/last-admin/self rules, hidden listings, cancel delegation, and admin UI empty/error states.
