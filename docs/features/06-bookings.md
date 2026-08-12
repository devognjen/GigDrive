# Feature: Booking Flow

- **Tier:** 0 (MVP)
- **PRD references:** §4.2 (Booking lifecycle), §4.4 (Seat capacity policy), §6.4 (FR-BOOK-01…05), §8 (`booking` entity), §9 (Bookings endpoints), §13 milestones M3, M10
- **Depends on:** 05-trips (07-email-notifications for the email hooks)

## Overview

Passengers request seats on a trip; the driver accepts or rejects; passengers can cancel. Capacity is enforced transactionally so two passengers can never take the last seat concurrently.

## Booking lifecycle

`PENDING → CONFIRMED | REJECTED`, plus `CANCELLED_BY_PASSENGER`. All transitions server-side only; transitions trigger email notifications (see 07-email-notifications).

## Seat capacity policy (§4.4)

- `activeSeats = sum(seats of CONFIRMED bookings)`.
- `PENDING` requests do **not** reserve capacity.
- Capacity is re-checked **inside a DB transaction at accept time** (prevents double-booking the last seat).

## Functional requirements

- **FR-BOOK-01 (Must):** Passenger requests N seats → PENDING; driver emailed.
- **FR-BOOK-02 (Must):** Driver accepts (transactional capacity check) / rejects; passenger emailed.
- **FR-BOOK-03 (Must):** Passenger cancels own booking; seat frees up; price recomputed (see 05-trips live pricing; FULL trips reopen).
- **FR-BOOK-04 (Should):** Driver marks booking "paid" (informational only — no payment processing, per §15 decisions).
- **FR-BOOK-05 (Tier 2):** Waitlist when FULL → tracked separately in 14-waitlist.

## Scope

### Backend (NestJS)
- `bookings` module: request, accept/reject (driver-only, ownership guard), cancel (passenger-only), paid flag (driver-only).
- Transactional capacity check at accept time.
- Booking status changes feed trip status (min reached → READY; seats full → FULL; reopen on cancel).
- DTOs + class-validator (`seats` positive, within remaining capacity at request time as a soft check).

### Frontend (Angular)
- Booking request form on trip details (number of seats).
- Passenger view: own bookings with statuses (`GET /bookings/mine`).
- Driver view: incoming requests with accept/reject, paid toggle.
- UI reflects price recomputation after confirm/cancel.

## Data model

`booking`: id, tripId→trip, passengerId→user, seats, status, paid flag, createdAt, decidedAt.

Enum: `BookingStatus` (module-level).

## API endpoints

- `POST /trips/:id/bookings`
- `GET /bookings/mine`
- `POST /bookings/:id/accept`
- `POST /bookings/:id/reject`
- `POST /bookings/:id/cancel`
- `PATCH /bookings/:id/paid`

## Acceptance criteria

- Requesting seats creates a PENDING booking and emails the driver.
- Accept performs a transactional capacity re-check — concurrent accepts cannot overbook.
- Reject/cancel free capacity (as applicable) and recompute the live price.
- Only the driver can accept/reject/mark paid; only the owning passenger can cancel.
- Paid flag is informational and driver-only.
- Unit tests cover capacity policy, transactional accept, status transitions, and guards.
