# Feature: Signal Group Automation

- **Tier:** 1 (committed, behind feature flag `FEATURE_SIGNAL` — first in the drop order per §13 scope ladder)
- **PRD references:** §5.2, §6.5 (FR-COMM-03), §10 (signal-cli-rest-api), §14 (risk: unofficial client), §13 milestone M12
- **Depends on:** 05-trips (CONFIRMED transition), 07-email-notifications (invite link delivery)

## Overview

On trip CONFIRMED, the backend uses a `signal-cli-rest-api` Docker service to create a Signal group `🎵 {Artist} — {City}, {date}`, generates an invite link, and emails it to the crew (driver + confirmed passengers).

**Experimental/unofficial:** the Signal client is unofficial (ToS gray area; number restriction risk). The invite-link flow avoids collecting user phone numbers. Email remains the primary channel; this is strictly an enhancement.

## Functional requirements

- **FR-COMM-03 (Tier 1):** Signal group auto-created + invite link emailed on CONFIRMED.

## Scope

### Backend (NestJS)
- `integrations/signal` service talking to `signal-cli-rest-api`; Signal number and service URL via `.env`.
- Hook on the READY→CONFIRMED trip transition: create group, generate invite link.
- Invite link emailed to driver + confirmed passengers via the notifications module.
- Whole feature gated behind `FEATURE_SIGNAL`; failure must not break the CONFIRMED transition (graceful degradation, log + continue).

### Infrastructure
- `signal-cli` service in docker-compose behind compose profile `signal`.

### Frontend (Angular)
- No dedicated UI (delivery is via email).

## Acceptance criteria

- Confirming a trip with the flag on creates a Signal group named `🎵 {Artist} — {City}, {date}` and emails the invite link to the crew.
- With the flag off (or Signal service down), trip confirmation works normally and no Signal step is attempted/blocking.
- No user phone numbers are collected anywhere in the flow.
- Documented as experimental in the README.
- Unit tests cover the integration service (HTTP mocked) and the flag gating.
