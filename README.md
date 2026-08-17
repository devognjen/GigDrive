# GigDrive — Concert Carpool Coordination Platform

GigDrive connects people travelling to the same concert: a driver publishes a shared-ride
offer with a full cost pool, passengers book seats, and the per-person price drops
automatically as more people join. Concerts are discovered through an external events API
(Ticketmaster) and cached locally, so trips survive API outages and quota limits.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | Angular · RxJS · NgRx (Store + Entity + Effects) |
| Backend  | NestJS · TypeORM · Passport.js (Local + JWT) · Nodemailer · Socket.IO |
| Database | PostgreSQL (Docker) |
| Infra    | docker-compose (`db`, `backend`, `frontend`, optional `signal-cli` profile) |
| Extras   | Ticketmaster Discovery API · Mailtrap (SMTP) · signal-cli-rest-api (experimental) |

## Project documentation

- [PRD.md](PRD.md) — full product requirements (domain model, API surface, milestones, risks)
- [PROGRESS.md](PROGRESS.md) — implementation status (single source of truth)
- [docs/features/](docs/features/) — one specification file per feature

## Getting started

### Prerequisites

- Docker with the Compose plugin (or Podman with the compose-compatible socket)
- For local development without containers: Node.js 24+ and pnpm 10+

### One-command start

```bash
cp .env.example .env   # defaults work out of the box; fill in secrets as needed
docker compose up --build
```

This starts:

| Service    | URL                            | Notes                              |
|------------|--------------------------------|------------------------------------|
| Frontend   | http://localhost:4200          | Angular app served by nginx        |
| Backend    | http://localhost:3000/api      | NestJS API                         |
| API docs   | http://localhost:3000/api/docs | Swagger UI                         |
| PostgreSQL | localhost:5432                 | credentials from `.env`            |

TypeORM migrations run automatically on backend startup. Seed the demo data
(demo driver, vehicles, cached concerts, a nearly-full trip) with:

```bash
docker compose exec backend node dist/database/seed.js
```

The seed is idempotent — safe to re-run. Demo login: `driver@gigdrive.demo` /
value of `SEED_DEMO_PASSWORD` (default `demo1234`).

The experimental Signal service (feature 11) is behind a compose profile:

```bash
docker compose --profile signal up
```

### Development mode (hot reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Backend and frontend sources are bind-mounted and watched. Rebuild a service
image after adding dependencies (`docker compose ... build backend`).

Alternatively, run only the database in Docker and the apps locally:

```bash
docker compose up db
cd backend  && pnpm install && pnpm migration:run && pnpm seed && pnpm start:dev
cd frontend && pnpm install && pnpm start
```

### Testing & quality

```bash
cd backend  && pnpm test && pnpm test:e2e && pnpm lint
cd frontend && pnpm test
```

### Database migrations

```bash
cd backend
pnpm migration:run                        # apply pending migrations
pnpm migration:generate src/database/migrations/<Name>   # diff entities → migration
pnpm migration:revert                     # roll back the last migration
```

## Project structure

```
backend/    NestJS API — feature modules under src/ (auth, users, vehicles,
            concerts, trips, bookings, reviews, notifications, chat,
            integrations), entities + migrations in src/, seed in src/database/
frontend/   Angular app — feature folders under src/app/features/ (auth,
            concerts, trips, bookings, profile), shared core under src/app/core/
docker-compose.yml        prod-like stack (db, backend, frontend via nginx)
docker-compose.dev.yml    hot-reload development override
```

## Configuration

All configuration lives in `.env` (never committed) — see
[.env.example](.env.example) for every supported variable: PostgreSQL
credentials, JWT secret, Ticketmaster API key, SMTP (Mailtrap) credentials,
`FEATURE_CHAT`, and the Signal number. Datetimes are stored in UTC (ISO 8601)
and displayed in local time.

In-app trip chat (feature 10) is on by default (`FEATURE_CHAT=true`). The UI
reads `GET /api/features` and, for trip members, opens a Socket.IO room at
namespace `/chat` (path `/api/socket.io`). Set `FEATURE_CHAT=false` to hide the
panel and disable history/gateway without affecting the rest of the app.
