# Feature: Vehicle Management

- **Tier:** 0 (MVP)
- **PRD references:** §5.1, §8 (`vehicle` entity), §9 (Vehicles endpoints), §13 milestone M3
- **Depends on:** 02-auth-and-users (owner reference, ownership guards)

## Overview

Registered users manage the vehicles they use as drivers. Vehicles constrain trips: `maxPassengers ≤ vehicle.seats` (see 05-trips).

## Scope

### Backend (NestJS)
- `vehicles` module with full CRUD.
- Ownership guard: only the owner may update/delete a vehicle.
- DTOs + class-validator (`seats` positive integer, `type` enum).

### Frontend (Angular)
- Vehicle list in the user profile area.
- Vehicle create/edit reactive form with validation.
- Delete with confirmation.

## Data model

`vehicle`: id, ownerId→user, type (CAR/VAN/MINIBUS), make, model, seats, notes.

Enum: `VehicleType` (module-level, not DB-dependent).

## API endpoints

- `GET /vehicles` (own vehicles)
- `POST /vehicles`
- `PATCH /vehicles/:id`
- `DELETE /vehicles/:id`

## Acceptance criteria

- Owner can create, list, edit and delete own vehicles.
- Other users cannot see-modify-delete someone else's vehicle (ownership guard).
- Validation rejects invalid payloads (e.g. non-positive seats, unknown type).
- Deleting a vehicle referenced by trips follows defined behavior (block or restrict — no orphaned trips).
- Unit tests cover the vehicles service and ownership guard.
