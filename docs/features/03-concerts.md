# Feature: Concert Discovery, Cache & Manual Creation

- **Tier:** 0 (MVP)
- **PRD references:** §4.3 (Concert cache), §6.2 (FR-CON-01…04), §8 (`concert` entity), §9 (Concerts endpoints), §10 (Ticketmaster), §13 milestones M2, M7
- **Depends on:** 01-infrastructure

## Overview

Concerts are discovered via the Ticketmaster Discovery API, proxied through the backend and upserted into a local `concert` cache table (`externalId` unique). Trips always reference local rows, so they survive API outages and quota exhaustion. Registered users can manually create concerts missing from the provider (regional coverage gaps).

## Functional requirements

- **FR-CON-01 (Must):** Instant search — keyword, city, radius, date range, genre; debounced, cancel-stale (`switchMap`).
- **FR-CON-02 (Must):** Results upserted into local cache; trips reference cached rows.
- **FR-CON-03 (Must):** Concert details page: info + linked trips.
- **FR-CON-04 (Must):** Manual concert creation by registered users.

## Scope

### Backend (NestJS)
- `concerts` module + `integrations/ticketmaster` service.
- Backend proxies all Ticketmaster calls (architectural rule); API key in `.env` (quota: 2 rps, 5000 req/day → cache mandatory).
- Search endpoint upserts provider results into `concert` (unique `externalId`).
- Filter-options endpoint returns distinct cities and genres from the cache (for search dropdowns).
- Graceful degradation: serve cached data when the provider is down or quota exhausted.
- Manual creation endpoint setting `externalId = NULL`, `userSubmitted = true`.

### Frontend (Angular)
- Concert search page with debounced, cancel-stale instant search (`switchMap`).
- Filters: keyword, city (dropdown of cached cities), date range, genre (dropdown of cached genres).
- Concert details page: concert info + list of linked trips.
- Manual concert creation form (registered users).

## Data model

`concert`: id, externalId (unique, nullable), userSubmitted flag, artist, title, venue, city, country, lat/lng?, startAt, imageUrl, genre, ticketUrl.

## API endpoints

- `GET /concerts/search?q&city&dateFrom&dateTo&genre&page`
- `GET /concerts/filter-options` (distinct cities/genres from the cache)
- `GET /concerts/:id`
- `POST /concerts` (manual creation, authenticated)

## Acceptance criteria

- Search is debounced and stale requests are cancelled (`switchMap`).
- Provider results are upserted; repeated searches hit the cache (quota-safe).
- Search/details still work with cached data when Ticketmaster is unreachable.
- Concert details show the concert and its linked trips.
- Authenticated users can create manual concerts flagged `userSubmitted`.
- City and genre filters are dropdowns populated from distinct cached values.
- Unit tests cover cache upsert logic, provider fallback, and search DTO validation.
