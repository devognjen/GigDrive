# Feature: Waitlist on Full Trips

- **Tier:** 2 (if time allows — priority 3 of Tier 2 per §5.3)
- **PRD references:** §5.3, §6.4 (FR-BOOK-05), §13 milestone M13
- **Depends on:** 06-bookings (FULL state, cancellations), 07-email-notifications (auto-notify)

## Overview

When a trip is FULL, interested passengers can join a waitlist. When a seat frees up (confirmed booking cancelled), waitlisted passengers are automatically notified by email.

## Functional requirements

- **FR-BOOK-05 (Tier 2):** Waitlist when FULL + auto-notify on free seat.

## Scope

### Backend (NestJS)
- Waitlist entries per trip (passenger, seats requested, position/createdAt).
- Join/leave waitlist endpoints; prevented when the trip is not FULL.
- On freed capacity, notify waitlisted passengers in order (email via notifications module).
- Joining the waitlist does not reserve capacity and does not affect pricing.

### Frontend (Angular)
- "Join waitlist" action on FULL trips (replaces the booking request form).
- Passenger dashboard shows waitlist entries with position; leave action.

## Acceptance criteria

- Passengers can join/leave the waitlist only while the trip is FULL.
- A freed seat triggers an email to waitlisted passengers in join order.
- Waitlist membership never blocks regular bookings when seats are available.
- Unit tests cover ordering, notification trigger, and FULL-state gating.
