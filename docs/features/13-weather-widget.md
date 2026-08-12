# Feature: Concert-Day Weather Widget

- **Tier:** 2 (if time allows — priority 2 of Tier 2 per §5.3)
- **PRD references:** §5.3, §10 (Open-Meteo), §12 (`zip` / `forkJoin` compliance demo), §13 milestone M13
- **Depends on:** 03-concerts (concert date and location)

## Overview

Shows a weather forecast for the concert day/location on the concert details page, using Open-Meteo — free and key-less. Doubles as the course's `zip`/`forkJoin` demonstration: `zip(eventDetails$, weather$)`.

## Scope

### Frontend (Angular)
- Weather widget on the concert details page, loaded in parallel with event details (`zip(eventDetails$, weather$)`).
- Sensible empty state when the concert has no coordinates or the date is outside the forecast range.

### Backend (NestJS)
- Backend proxies the Open-Meteo call (architectural rule: backend proxies all external APIs); no API key required.

## Acceptance criteria

- Concert details display the forecast for the concert day when coordinates and date allow.
- Open-Meteo is called through the backend proxy; failures degrade gracefully (widget hidden, page unaffected).
- `zip`/`forkJoin` combination is demonstrable in the code for the compliance matrix.
- Unit tests cover the forecast mapping and failure fallback.
