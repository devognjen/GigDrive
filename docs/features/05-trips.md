# Feature: Trip Offers & Dynamic Shared Pricing

- **Tier:** 0 (MVP)
- **PRD references:** §4.1 (Dynamic shared pricing), §4.2 (Trip lifecycle), §6.3 (FR-TRIP-01…06), §8 (`trip`, `trip_stop` entities), §9 (Trips endpoints), §13 milestones M3, M8, M9
- **Depends on:** 02-auth-and-users, 03-concerts, 04-vehicles

## Overview

The core feature: a driver publishes a shared-ride offer to a concert with a full cost pool; the per-person price drops automatically as more passengers are confirmed. Includes pickup stops, filters/sorting, the trip lifecycle state machine, and the scheduled deadline sweep.

## Dynamic shared pricing (§4.1)

- Driver sets: `totalCost` (fuel + tolls + parking), `minPassengers` (go/no-go threshold), `maxPassengers` (≤ vehicle seats), `confirmationDeadline`.
- **Live price per person** = `ceil(totalCost / max(minPassengers, confirmedSeats))`.
- Bounds: worst case = `totalCost / min` (guaranteed max), best case = `totalCost / max` (full vehicle).
- Every new confirmed passenger lowers the price for everyone — recalculated reactively in the UI.
- Pricing modes: `SHARED_TOTAL` (above) or `FIXED_PER_SEAT` (flat seat price). Enum `PricingMode` module-level.
- README/demo example: total 120 €, min 4, max 8 → price band 30 € → 15 €.

## Trip lifecycle state machine (§4.2)

```
OPEN ──(min reached)──> READY ──(driver confirms)──> CONFIRMED ──> COMPLETED
  │                      │
  └──(deadline, min not met)──> CANCELLED          (auto, via scheduled job)
OPEN ──(seats full)──> FULL (still OPEN-like; reopens if a booking cancels)
```

All transitions are server-side only; transitions trigger email notifications (see 07-email-notifications).

## Functional requirements

- **FR-TRIP-01 (Must):** Create trip: vehicle, concert, totalCost, min/max passengers, deadline, pickup stops, round-trip flag, pricing mode.
- **FR-TRIP-02 (Must):** Validation: `min ≤ max ≤ vehicle.seats`, confirmation deadline < departure ≤ concert date.
- **FR-TRIP-03 (Must):** Browse/filter trips per concert: departure city, vehicle type, price band, seats left, min driver rating; sorting (cheapest, "most likely to happen").
- **FR-TRIP-04 (Must):** Live per-person price displayed and reactively recomputed.
- **FR-TRIP-05 (Must):** Driver actions: edit (while OPEN), confirm (READY→CONFIRMED), cancel.
- **FR-TRIP-06 (Must):** Scheduled job (`@nestjs/schedule`): past-deadline OPEN trips with min not met → CANCELLED + notify.

## Scope

### Backend (NestJS)
- `trips` module: CRUD, state machine transitions, live-price calculation, scheduled deadline sweep.
- Trip stops management (`trip_stop`: seq, place, lat/lng?, plannedTime).
- Ownership guard: only the trip's driver can edit/confirm/cancel.
- `GET /trips/:id` includes live price; list endpoint supports filters and sorting.
- Currency field (EUR/RSD).

### Frontend (Angular)
- Trip creation/edit reactive form with validation (incl. pickup stops).
- Concert picker on create/edit: searchable combobox of upcoming concerts (no raw UUID). Prefills from `?concertId=`; concert details and per-concert trip lists link here. Choosing a concert with empty dates suggests departure 3 hours before start and a deadline a day before departure.
- Create/edit pricing is grouped as mode + major-unit amount with a compact currency suffix and a live per-person preview; capacity is min-to-go / seats offered with `min ≤ max ≤ vehicle.seats` checked in the form.
- Native `datetime-local` min/max plus a cross-field validator enforce deadline < departure ≤ concert start (also enforced in TripsService).
- Trip browsing per concert with reactive filters (`combineLatest([trips$, filters$])`) and live price recompute.
- Trip details page (param route) with price band, live price, stops, driver rating.
- Sorting: cheapest, "most likely to happen".
- Driver actions on own trips: edit while OPEN, confirm, cancel.

## Data model

`trip`: id, driverId→user, vehicleId→vehicle, concertId→concert, pricingMode, totalCost, currency, minPassengers, maxPassengers, deadline, departureAt, roundTrip, notes, status.

`trip_stop`: id, tripId→trip, seq, place, lat/lng?, plannedTime.

Enums: `TripStatus`, `PricingMode` (module-level).

## API endpoints

- `POST /trips`
- `GET /trips?concertId&from&vehicleType&maxPrice&minRating&seatsMin`
- `GET /trips/:id` (incl. live price)
- `PATCH /trips/:id`
- `POST /trips/:id/confirm`
- `GET /trips/mine`

## Acceptance criteria

- Trip creation enforces FR-TRIP-02 validation rules (`min ≤ max ≤ vehicle.seats`, deadline < departure ≤ concert date).
- Live price matches the §4.1 formula for both pricing modes and updates on every confirmed-seat change.
- Filters and sorting work per FR-TRIP-03.
- Only the driver can edit (while OPEN), confirm (READY→CONFIRMED) or cancel.
- Scheduled job cancels past-deadline under-subscribed trips and triggers notifications.
- FULL trips reopen to OPEN when a confirmed booking cancels.
- Unit tests cover the pricing calculation, state machine transitions, validation, and the deadline sweep job.
