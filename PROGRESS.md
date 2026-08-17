# GigDrive — Implementation Progress

Tracks implementation progress of all GigDrive features extracted from [PRD.md](../PRD.md).
Each feature has a specification file in [docs/features/](docs/features/).
**Status is tracked only in this file** (single source of truth) — update it as work proceeds.

**Status legend:** ⬜ Not started · 🔶 In progress · ✅ Done · ⏸️ Deferred/dropped

Last updated: 2026-08-17

## Tier 0 — MVP (must have)

| # | Feature | Spec | Milestone | Status | Notes |
|---|---------|------|-----------|--------|-------|
| 1 | Infrastructure, Docker & seed data | [01-infrastructure.md](docs/features/01-infrastructure.md) | M0 | ✅ | Stack boots via compose; migrations + idempotent seed verified |
| 2 | Authentication & user profiles | [02-auth-and-users.md](docs/features/02-auth-and-users.md) | M1 | ✅ | Passport local→JWT, global guard + `@Public()`, profile edit + public profile (rating empty state until #9); frontend interceptor, guards, auth/profile pages |
| 3 | Concert discovery, cache & manual creation | [03-concerts.md](docs/features/03-concerts.md) | M2, M7 | ✅ | Ticketmaster proxy + cache-first search (provider only on cache miss, upsert on `externalId`); details page with linked trips; manual creation (`userSubmitted`). Radius filter dropped (FR-CON-01 vs endpoint spec conflict; no geo source for typed cities) |
| 4 | Vehicle management | [04-vehicles.md](docs/features/04-vehicles.md) | M3 | ✅ | CRUD + ownership guard (404 unknown, 403 foreign); delete of trip-referenced vehicle blocked with 409; vehicles section embedded in profile page |
| 5 | Trip offers & dynamic shared pricing | [05-trips.md](docs/features/05-trips.md) | M3, M8, M9 | ✅ | Pricing calculator + state machine (pure, unit-tested); trips module CRUD, ownership guard, live price, filters/sorting, scheduled deadline sweep; notification seam (feature 07 swaps transport); Angular trip browse/create/edit/details with reactive filters & live price |
| 6 | Booking flow | [06-bookings.md](docs/features/06-bookings.md) | M3, M10 | ✅ | Bookings module: request (PENDING), accept (transactional pessimistic-lock capacity re-check), reject, cancel (passenger), paid toggle (driver); booking-notification seam (feature 07 swaps transport); driver/passenger ownership guards; DTOs; Angular request form on trip details + My Bookings + driver incoming-requests views; service & guard unit tests |
| 7 | Email notifications | [07-email-notifications.md](docs/features/07-email-notifications.md) | M4 | ✅ | Nodemailer + Mailtrap SMTP; lifecycle emails honor `emailNotifications`; T-24h reminder cron; mail events logged |
| 8 | Driver & passenger dashboards | [08-dashboards.md](docs/features/08-dashboards.md) | M10 | ⬜ | |
| 9 | Reviews & driver ratings | [09-reviews.md](docs/features/09-reviews.md) | M11 | ⬜ | |

## Tier 1 — Committed (behind feature flags)

| # | Feature | Spec | Milestone | Status | Notes |
|---|---------|------|-----------|--------|-------|
| 10 | In-app trip chat | [10-trip-chat.md](docs/features/10-trip-chat.md) | M12 | ⬜ | Feature-flagged |
| 11 | Signal group automation | [11-signal-automation.md](docs/features/11-signal-automation.md) | M12 | ⬜ | Flag `FEATURE_SIGNAL`; drop first if time runs short |

## Tier 2 — If time allows (priority order)

| # | Feature | Spec | Milestone | Status | Notes |
|---|---------|------|-----------|--------|-------|
| 12 | Pickup-stop maps (Leaflet + OSM) | [12-pickup-stop-maps.md](docs/features/12-pickup-stop-maps.md) | M13 | ⬜ | |
| 13 | Concert-day weather widget (Open-Meteo) | [13-weather-widget.md](docs/features/13-weather-widget.md) | M13 | ⬜ | |
| 14 | Waitlist on full trips | [14-waitlist.md](docs/features/14-waitlist.md) | M13 | ⬜ | FR-BOOK-05 |
| 15 | CSV passenger manifest export | [15-csv-export.md](docs/features/15-csv-export.md) | M13 | ⬜ | |

## Summary

- **Total:** 15 features · ✅ Done: 7 · 🔶 In progress: 0 · ⬜ Not started: 8 · ⏸️ Deferred: 0
- **Current focus:** Feature 8 — Driver & passenger dashboards (M10)

## Working agreements

- Implementation order follows the PRD §13 milestones (M0 → M13); Tier-1/2 items only after the MVP is complete.
- Scope ladder (PRD §13): if time shrinks, drop in order: Signal → chat; if time grows, add Tier 2 in listed order.
- Every feature ships with unit tests (per AGENTS.md) and clean-code conventions (feature modules, DTOs + class-validator, no entities exposed from controllers).
- Cross-cutting frontend wiring (Angular shell, routing, interceptor, guards — M5; NgRx store/entities/effects — M6) is part of features 2–9 as they land.
- When a feature's status changes, update the table, the summary counts, and the "Last updated" date.
