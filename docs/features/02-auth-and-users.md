# Feature: Authentication & User Profiles

- **Tier:** 0 (MVP)
- **PRD references:** §3 (Users & roles), §6.1 (FR-AUTH-01…04), §8 (`user` entity), §9 (Auth/Users endpoints), §13 milestone M1
- **Depends on:** 01-infrastructure

## Overview

Email + password authentication with Passport.js (LocalStrategy → JWT) and bcrypt hashing. Roles (Driver/Passenger) are emergent from actions, not fixed at registration; there is no admin role. Guests may browse concerts and trips read-only.

## Functional requirements

- **FR-AUTH-01 (Must):** Register with email + password — validated, bcrypt-hashed.
- **FR-AUTH-02 (Must):** Login → JWT; protected routes via guard; token attached by HTTP interceptor on the frontend.
- **FR-AUTH-03 (Must):** Edit profile, including notification preference (`emailNotifications`, default ON).
- **FR-AUTH-04 (Should):** Public user profile: name, average rating, review count.

## Scope

### Backend (NestJS)
- `auth` module: Passport LocalStrategy (login), JWT strategy (protected routes), bcrypt hashing.
- `users` module: profile read/update, public profile with aggregated rating.
- Global JWT guard; ownership guards prepared for other resources.
- DTOs + class-validator for register/login/profile payloads; entities never exposed from controllers.

### Frontend (Angular)
- Register / login pages with reactive forms and validation.
- Auth HTTP interceptor attaching the JWT.
- Route guards for authenticated areas; lazy auth feature routes.
- Profile edit page with notification preference toggle.
- Public profile view (name, average rating, review count).

## Data model

`user`: id, email (unique), passwordHash, firstName, lastName, phone?, emailNotifications (default true).

## API endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users/:id` (public profile)
- `PATCH /users/me`

## Acceptance criteria

- Registration validates input and stores only bcrypt hashes.
- Login returns a JWT; protected endpoints reject missing/invalid tokens.
- Frontend interceptor attaches the token; guards redirect unauthenticated users.
- Profile update persists notification preference (default ON).
- Public profile shows name, average rating and review count (empty state before any reviews).
- Unit tests cover auth service, strategies/guards, and user profile logic.
