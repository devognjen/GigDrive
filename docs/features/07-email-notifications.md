# Feature: Email Notifications

- **Tier:** 0 (MVP)
- **PRD references:** §2 (email is the reliable default channel), §6.5 (FR-COMM-01), §10 (Mailtrap + Nodemailer), §13 milestone M4
- **Depends on:** 02-auth-and-users (notification preference); hooks into 05-trips and 06-bookings

## Overview

Transactional email via Nodemailer + SMTP. Email is the primary communication channel (chat and Signal are enhancements). All mail events are also logged. Use **Mailtrap** for local sandbox testing or **Brevo** (or any SMTP provider) for real delivery — switch via `.env` only.

## Functional requirements

- **FR-COMM-01 (Must):** Emails on:
  - booking requested (→ driver)
  - booking accepted (→ passenger)
  - booking rejected (→ passenger)
  - trip READY (min reached)
  - trip CONFIRMED
  - trip CANCELLED (incl. scheduled deadline sweep)
  - T-24h reminder before departure (scheduled job)

## Scope

### Backend (NestJS)
- `notifications` module wrapping Nodemailer; SMTP config via `.env` (Mailtrap sandbox for local dev; Brevo or any SMTP for real delivery).
- Email templates for each lifecycle event.
- Hooks invoked from trip state transitions and booking transitions (never from the frontend).
- T-24h reminder via `@nestjs/schedule` job.
- Honor per-user `emailNotifications` preference (default ON) — see 02-auth-and-users.
- Log every mail event (audit trail / demo fallback).

### Frontend (Angular)
- No dedicated UI beyond the notification preference toggle on the profile page (feature 02).

## Acceptance criteria

- Every listed lifecycle event sends the correct email to the correct recipients.
- Users with `emailNotifications = false` receive no emails.
- T-24h reminder fires for confirmed trips ~24h before departure.
- SMTP credentials come from `.env`; no secrets committed.
- All mail events are logged.
- Unit tests cover the notifications module (transport mocked) and preference filtering.
