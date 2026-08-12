# Feature: In-App Trip Chat

- **Tier:** 1 (committed, implemented behind a feature flag — first to be dropped under time pressure per §13 scope ladder)
- **PRD references:** §5.2, §6.5 (FR-COMM-02), §8 (`chat_message` entity), §9 (Chat endpoints), §13 milestone M12
- **Depends on:** 06-bookings (membership = driver + confirmed passengers)

## Overview

Real-time per-trip chat room via a NestJS WebSocket gateway. One room per trip; members are the driver and confirmed passengers. Message history is persisted. Email remains the primary communication channel — chat is an enhancement.

## Functional requirements

- **FR-COMM-02 (Tier 1):** Per-trip WebSocket chat room (driver + confirmed passengers).

## Scope

### Backend (NestJS)
- `chat` module with WebSocket gateway (`WS /chat`, trip rooms).
- Membership enforcement: only the trip's driver and confirmed passengers may join a room.
- `chat_message` persistence; history endpoint `GET /trips/:id/messages`.

### Frontend (Angular)
- Chat panel on the trip details page (visible only to room members).
- Loads history via REST, live messages via WebSocket.
- Feature-flagged UI entry point.

## Data model

`chat_message`: id, tripId→trip, authorId→user, body, sentAt.

## API endpoints

- `WS /chat` (trip rooms)
- `GET /trips/:id/messages` (history)

## Acceptance criteria

- Non-members cannot join a trip's room or read its history.
- Messages are persisted and reload from history.
- Multiple concurrent members receive messages in real time.
- Feature can be disabled via flag without breaking the rest of the app.
- Unit tests cover membership checks and message persistence; gateway logic tested with mocked sockets.
