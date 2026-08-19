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
| Extras   | Ticketmaster Discovery API · Nodemailer SMTP (Mailtrap / Brevo) · signal-cli-rest-api (experimental) |

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

TypeORM migrations run automatically on backend startup, followed by an
idempotent demo seed (cached concerts, demo driver, vehicles, a nearly-full
trip). Disable with `SEED_ON_START=false`. Re-run manually with:

```bash
docker compose exec backend node dist/database/seed.js
```

The seed is idempotent — safe to re-run. Demo login: `driver@gigdrive.demo` /
value of `SEED_DEMO_PASSWORD` (default `demo1234`).

### Experimental Signal group automation

Signal group creation (feature 11) is **experimental**. It uses the unofficial
`signal-cli-rest-api` client (ToS gray area; the registered number can be
restricted). Email remains the primary channel; GigDrive never sends user phone
numbers to Signal — crew members join via an invite link.

The `signal-cli` service is behind a compose profile and stays off unless you
start it explicitly:

```bash
docker compose --profile signal up
```

Then set `FEATURE_SIGNAL=true` and `SIGNAL_NUMBER` to the account registered
with signal-cli. When the flag is off, or the service is down, trip confirmation
works normally and the Signal step is skipped.

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
credentials, JWT secret, Ticketmaster API key, SMTP settings,
`FEATURE_CHAT`, `FEATURE_SIGNAL`, and the Signal number. Datetimes are stored
in UTC (ISO 8601) and displayed in local time.

### Email (SMTP)

Transactional emails (booking requests, trip confirmations, reminders, etc.)
are sent by the backend via **Nodemailer**. The SMTP provider is chosen
entirely through `.env` — no code changes when switching.

#### Mailtrap (local development)

The defaults in `.env.example` target [Mailtrap Email Testing](https://mailtrap.io):
a sandbox inbox that catches all outgoing mail without delivering to real
addresses. Ideal for everyday development.

1. Create a Mailtrap account and open an inbox under **Email Testing**.
2. Copy the inbox **SMTP credentials** into `.env`:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=<mailtrap-username>
   SMTP_PASS=<mailtrap-password>
   ```
3. Restart the backend: `docker compose restart backend`
4. Trigger an email from the app (e.g. request seats on a trip) and view the
   message in the Mailtrap inbox UI.

#### Brevo (real delivery for demos)

For live demos where recipients should receive mail in their real inbox,
use [Brevo](https://www.brevo.com) (free tier: **300 emails/day**, no credit
card required).

1. Sign up at [brevo.com](https://www.brevo.com) and verify your account email.
2. **Settings → SMTP & API → SMTP** — generate an **SMTP key** (this is
   `SMTP_PASS`, not your login password).
3. **Senders, Domains & Dedicated IPs → Senders** — add and verify a sender
   address (required before Brevo will send).
4. Set `.env` (replace the Mailtrap values):
   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your-brevo-login-email@example.com
   SMTP_PASS=your-brevo-smtp-key
   MAIL_FROM="GigDrive <your-verified-sender@example.com>"
   ```
5. Restart the backend: `docker compose restart backend`
6. Use **real email addresses** when registering demo users — messages are
   delivered to those inboxes.

#### Switching providers

Change the `SMTP_*` variables in `.env` and restart the backend. Mailtrap
and Brevo can coexist as commented blocks in `.env.example`; only one profile
should be active at a time.

#### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Log shows `reason=smtp_unconfigured` | Empty `SMTP_USER` or `SMTP_PASS` | Fill credentials and restart backend |
| Action succeeds, no mail (Mailtrap) | Wrong inbox credentials | Re-copy SMTP settings from Mailtrap |
| Action succeeds, no mail (Brevo) | Sender not verified | Verify sender in Brevo dashboard |
| Log shows `failed` | Auth or TLS error | Check host/port/key; Brevo uses port 587 |
| User receives nothing | Notifications off | **Profile → Email notifications** must be ON |

All send attempts are logged by the backend regardless of provider:
`docker compose logs backend | grep -E 'sent|skipped|failed'`

In-app trip chat (feature 10) is on by default (`FEATURE_CHAT=true`). The UI
reads `GET /api/features` and, for trip members, opens a Socket.IO room at
namespace `/chat` (path `/api/socket.io`). Set `FEATURE_CHAT=false` to hide the
panel and disable history/gateway without affecting the rest of the app.

Signal group automation (feature 11) is off by default (`FEATURE_SIGNAL=false`).
When enabled, confirming a trip creates a Signal group named
`🎵 {Artist} — {City}, {date}` and emails the invite link to the driver and
confirmed passengers. There is no dedicated UI.
