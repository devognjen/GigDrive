# Feature: Pickup-Stop Maps (Leaflet + OpenStreetMap)

- **Tier:** 2 (if time allows — priority 1 of Tier 2 per §5.3)
- **PRD references:** §5.3, §10 (OpenStreetMap + Leaflet), §13 milestone M13
- **Depends on:** 05-trips (trip stops with lat/lng)

## Overview

Displays a trip's pickup stops on an interactive map using Leaflet + OpenStreetMap — free and key-less, no additional provider accounts.

## Scope

### Frontend (Angular)
- Leaflet map component on the trip details page rendering pickup stops (`trip_stop` lat/lng) as markers in sequence order.
- Map shown only when stops have coordinates; graceful fallback to the plain stop list otherwise.

### Backend (NestJS)
- No changes beyond what 05-trips provides (stops already carry optional lat/lng). If needed, extend stop input to capture coordinates.

## Acceptance criteria

- Trip details show pickup stops on an OSM/Leaflet map when coordinates exist.
- No API key required; tiles loaded from OpenStreetMap within usage policy.
- Trips without coordinates still render the textual stop list.
- Unit tests cover the map component's marker mapping logic.
