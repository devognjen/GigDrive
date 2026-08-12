# GigDrive — Concert Carpool Coordination Platform

GigDrive connects people travelling to the same concert: a driver publishes a shared-ride
offer with a full cost pool, passengers book seats, and the per-person price drops
automatically as more people join. Concerts are discovered through an external events API
(Ticketmaster) and cached locally, so trips survive API outages and quota limits.

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | Angular · RxJS · NgRx (Store + Entity + Effects) |
| Backend  | NestJS · TypeORM · Passport.js (Local + JWT) · Nodemailer |
| Database | PostgreSQL (Docker) |
| Infra    | docker-compose (`db`, `backend`, `frontend`, optional `signal-cli` profile) |
| Extras   | Ticketmaster Discovery API · Mailtrap (SMTP) · signal-cli-rest-api (experimental) |

## Project documentation

- [PRD.md](PRD.md) — full product requirements (domain model, API surface, milestones, risks)
- [PROGRESS.md](PROGRESS.md) — implementation status (single source of truth)
- [docs/features/](docs/features/) — one specification file per feature
