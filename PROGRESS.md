# GigDrive — Implementation Progress

Tracks implementation progress of all GigDrive features extracted from [PRD.md](../PRD.md).
Each feature has a specification file in [docs/features/](docs/features/).
**Status is tracked only in this file** (single source of truth) — update it as work proceeds.

**Status legend:** ⬜ Not started · 🔶 In progress · ✅ Done · ⏸️ Deferred/dropped

Last updated: 2026-08-18

## Tier 0 — MVP (must have)

| # | Feature | Spec | Milestone | Status | Notes |
|---|---------|------|-----------|--------|-------|
| 1 | Infrastructure, Docker & seed data | [01-infrastructure.md](docs/features/01-infrastructure.md) | M0 | ✅ | Stack boots via compose; migrations + idempotent seed verified |
| 2 | Authentication & user profiles | [02-auth-and-users.md](docs/features/02-auth-and-users.md) | M1 | ✅ | Passport local→JWT, global guard + `@Public()`, profile edit + public profile (rating empty state until #9); frontend interceptor, guards, auth/profile pages |
| 3 | Concert discovery, cache & manual creation | [03-concerts.md](docs/features/03-concerts.md) | M2, M7 | ✅ | Ticketmaster proxy + cache-first search (provider only on cache miss, upsert on `externalId`); details page with linked trips; manual creation (`userSubmitted`). Radius filter dropped (FR-CON-01 vs endpoint spec conflict; no geo source for typed cities). Startup seed fills the concert cache so search works when Ticketmaster is unconfigured/401. City/genre search filters are `<select>`s of distinct cache values (`GET /concerts/filter-options`). `GET /concerts/upcoming` feeds the trip-create picker |
| 4 | Vehicle management | [04-vehicles.md](docs/features/04-vehicles.md) | M3 | ✅ | CRUD + ownership guard (404 unknown, 403 foreign); delete of trip-referenced vehicle blocked with 409; vehicles section embedded in profile page |
| 5 | Trip offers & dynamic shared pricing | [05-trips.md](docs/features/05-trips.md) | M3, M8, M9 | ✅ | Pricing calculator + state machine (pure, unit-tested); trips module CRUD, ownership guard, live price, filters/sorting, scheduled deadline sweep; notification seam (feature 07 swaps transport); Angular trip browse/create/edit/details with reactive filters & live price. Create/edit picks a concert by name (searchable upcoming list) instead of a UUID; confirmation deadline must precede departure, and both are capped at concert start |
| 6 | Booking flow | [06-bookings.md](docs/features/06-bookings.md) | M3, M10 | ✅ | Bookings module: request (PENDING), accept (transactional pessimistic-lock capacity re-check), reject, cancel (passenger), paid toggle (driver); booking-notification seam (feature 07 swaps transport); driver/passenger ownership guards; DTOs; Angular request form on trip details + My Bookings + driver incoming-requests views; service & guard unit tests |
| 7 | Email notifications | [07-email-notifications.md](docs/features/07-email-notifications.md) | M4 | ✅ | Nodemailer + Mailtrap SMTP; lifecycle emails honor `emailNotifications`; T-24h reminder cron; mail events logged |
| 8 | Driver & passenger dashboards | [08-dashboards.md](docs/features/08-dashboards.md) | M10 | ✅ | Driver/passenger home bases via NgRx entity adapters; map/reduce earnings; accept/reject/paid and cancel; presentational trip-card & booking-list; concert summary + nested trip on booking DTOs |
| 9 | Reviews & driver ratings | [09-reviews.md](docs/features/09-reviews.md) | M11 | ✅ | Reviews module: eligibility guard (confirmed booking + past concert), one review per passenger/trip, rating aggregation on profiles and trip listings (feeds min-rating filter); Angular review form on passenger dashboard + ratings on trip cards/details and public profile |

## Tier 1 — Committed (behind feature flags)

| # | Feature | Spec | Milestone | Status | Notes |
|---|---------|------|-----------|--------|-------|
| 10 | In-app trip chat | [10-trip-chat.md](docs/features/10-trip-chat.md) | M12 | ✅ | Feature-flagged (`FEATURE_CHAT`); WS `/chat` + `GET /trips/:id/messages`; trip-details panel for driver + confirmed passengers |
| 11 | Signal group automation | [11-signal-automation.md](docs/features/11-signal-automation.md) | M12 | ✅ | Feature-flagged (`FEATURE_SIGNAL`); group + invite link emailed on CONFIRMED; compose profile `signal`; failures do not block confirmation |

## Tier 2 — If time allows (priority order)

| # | Feature | Spec | Milestone | Status | Notes |
|---|---------|------|-----------|--------|-------|
| 12 | Pickup-stop maps (Leaflet + OSM) | [12-pickup-stop-maps.md](docs/features/12-pickup-stop-maps.md) | M13 | ✅ | Leaflet map on trip details when stops have lat/lng; numbered markers in seq order; OSM tiles (no key); textual stop list always shown; optional coords on create/edit |
| 13 | Concert-day weather widget (Open-Meteo) | [13-weather-widget.md](docs/features/13-weather-widget.md) | M13 | ✅ | Backend Open-Meteo proxy (`GET /concerts/:id/weather`); details page `zip(eventDetails$, weather$)`; empty state for missing coords / out-of-range date; provider failure hides the widget; headline seed concert moved inside the 16-day forecast window |
| 14 | Waitlist on full trips | [14-waitlist.md](docs/features/14-waitlist.md) | M13 | ✅ | FR-BOOK-05: join/leave while FULL; notify in join order when a confirmed booking cancels; waitlist never reserves seats |
| 15 | CSV passenger manifest export | [15-csv-export.md](docs/features/15-csv-export.md) | M13 | ✅ | Driver-only `GET /trips/:id/manifest` (confirmed bookings, RFC 4180 CSV); Export CSV on driver dashboard and trip details when `confirmedSeats > 0` |

## Summary

- **Total:** 15 features · ✅ Done: 15 · 🔶 In progress: 0 · ⬜ Not started: 0 · ⏸️ Deferred: 0
- **Current focus:** —

## Working agreements

- Implementation order follows the PRD §13 milestones (M0 → M13); Tier-1/2 items only after the MVP is complete.
- Scope ladder (PRD §13): if time shrinks, drop in order: Signal → chat; if time grows, add Tier 2 in listed order.
- Every feature ships with unit tests (per AGENTS.md) and clean-code conventions (feature modules, DTOs + class-validator, no entities exposed from controllers).
- Cross-cutting frontend wiring (Angular shell, routing, interceptor, guards — M5; NgRx store/entities/effects — M6) is part of features 2–9 as they land.
- When a feature's status changes, update the table, the summary counts, and the "Last updated" date.
