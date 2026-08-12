# Feature: Reviews & Driver Ratings

- **Tier:** 0 (MVP)
- **PRD references:** §6.6 (FR-REV-01…02), §8 (`review` entity), §9 (Reviews endpoints), §13 milestone M11
- **Depends on:** 06-bookings (confirmed booking check), 02-auth-and-users (profile rating display)

## Overview

After a trip's date has passed, confirmed passengers can review the driver (1–5 + comment). Aggregated driver ratings are surfaced on trip cards and public profiles, building accountability.

## Functional requirements

- **FR-REV-01 (Must):** Confirmed passenger may review driver once the trip date passed (1–5 + comment).
- **FR-REV-02 (Must):** Driver rating surfaced on trip cards & profiles.

## Scope

### Backend (NestJS)
- `reviews` module: create review, list reviews per user.
- Review guard: author must have a CONFIRMED booking on the trip, and the concert date must be in the past.
- One review per passenger per trip.
- Rating aggregation (average, count) exposed for user profiles and trip listings (used by FR-AUTH-04 public profile and FR-TRIP-03 min-rating filter).

### Frontend (Angular)
- Review form (1–5 rating + comment) available on eligible past trips from the passenger dashboard.
- Average rating + review count shown on trip cards, driver profiles, and public user profile.

## Data model

`review`: id, tripId→trip, authorId→user, rating (1–5), comment, createdAt.

## API endpoints

- `POST /trips/:id/reviews`
- `GET /users/:id/reviews`

## Acceptance criteria

- Review creation is rejected unless the author has a confirmed booking and the concert date has passed.
- A passenger cannot review the same trip twice.
- Average rating and review count appear on trip cards and profiles.
- Rating data feeds the trip filter "min driver rating" (feature 05).
- Unit tests cover the review guard and rating aggregation.
