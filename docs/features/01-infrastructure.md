# Feature: Infrastructure, Docker & Seed Data

- **Tier:** 0 (MVP)
- **PRD references:** §5.1, §7 (Non-functional), §11 (Architecture), §13 milestone M0
- **Depends on:** nothing (foundation for all other features)

## Overview

One-command development environment with Dockerized PostgreSQL, initialized NestJS backend and Angular frontend, and a seed script producing reproducible demo data.

## Scope

### Docker / compose
- `docker-compose.yml` with services:
  - `db` — PostgreSQL (course requirement: DB via Docker)
  - `backend` — NestJS API
  - `frontend` — Angular served via nginx
  - `signal-cli` — optional service, behind compose profile `signal` (used by feature 11)
- One-command start for the whole stack.

### Backend foundation
- NestJS project initialized with feature-module layout (`auth`, `users`, `vehicles`, `concerts`, `trips`, `bookings`, `reviews`, `notifications`, `chat`, `integrations`).
- TypeORM connected to PostgreSQL, with migrations.
- `@nestjs/schedule` available for scheduled jobs (trip deadline sweep, T-24h reminders).
- Swagger API documentation.
- Lint/format tooling configured.

### Frontend foundation
- Angular project initialized with feature folders (`auth`, `concerts`, `trips`, `bookings`, `profile`), lazy routes, guards, reactive forms, OnPush where beneficial.
- NgRx Store + Entity + Effects set up.

### Configuration & secrets
- All secrets via `.env`, never committed: Ticketmaster key, SMTP credentials, JWT secret, Signal number.
- Datetimes stored UTC (ISO), displayed local.

### Seed script
- Reproducible demo data: demo driver, vehicles, cached concerts, a nearly-full trip (per §7 DevEx).

## Acceptance criteria

- `docker-compose up` starts db + backend + frontend from a clean checkout.
- TypeORM migrations run against the Dockerized PostgreSQL.
- Seed script populates demo data idempotently.
- README documents setup steps (screenshots added during M11 polish).
- No secrets in the repository; `.env.example` documents required variables.
- Incremental, conventional-commit Git history from the start (course requirement).
