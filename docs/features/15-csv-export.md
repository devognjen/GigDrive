# Feature: CSV Passenger Manifest Export

- **Tier:** 2 (if time allows — priority 4 of Tier 2 per §5.3)
- **PRD references:** §5.3, §13 milestone M13
- **Depends on:** 06-bookings (confirmed bookings), 05-trips (driver ownership)

## Overview

The driver can export a CSV manifest of confirmed passengers for a trip — names, seats, paid flag — handy for the day of the concert.

## Scope

### Backend (NestJS)
- Export endpoint on the trip resource, guarded by driver ownership.
- CSV columns: passenger name, email/phone (as available), seats, paid flag, booking status.
- Correct `Content-Type: text/csv` and `Content-Disposition` attachment headers.

### Frontend (Angular)
- "Export CSV" button on the driver dashboard / trip management view for trips with confirmed bookings.
- Plain browser download of the generated file.

## Acceptance criteria

- Only the trip's driver can export the manifest.
- CSV contains exactly the confirmed bookings with correct seats and paid flags.
- File downloads with a sensible filename (artist/city/date based).
- Unit tests cover CSV generation and the ownership guard.
