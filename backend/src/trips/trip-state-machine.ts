import { ConflictException, Injectable } from '@nestjs/common';
import { TripStatus } from '../common/enums';

export interface TripStateContext {
  /** Currently persisted status. */
  status: TripStatus;
  /** Sum of seats from CONFIRMED bookings. */
  confirmedSeats: number;
  minPassengers: number;
  maxPassengers: number;
  /** Go/no-go decision deadline. */
  confirmationDeadline: Date;
  /** Departure date/time. */
  departureAt: Date;
}

/**
 * Read-only trip status computation (PRD §4.2).
 *
 * The state machine is:
 *
 *   OPEN ──(min reached)──> READY ──(driver confirms)──> CONFIRMED ──> COMPLETED
 *     │                      │
 *     └──(deadline, min not met)──> CANCELLED
 *   OPEN ──(seats full)──> FULL   (OPEN-like; reopens when a booking cancels)
 *
 * Transitions are driven exclusively by the server. This class is a pure
 * helper that derives the *next* state from the current context so the
 * mutation logic in TripsService stays small and the rules stay unit-testable.
 * The CANCELLED/COMPLETED sweeps are triggered by the scheduled job; the
 * capacity-triggered OPEN↔FULL↔READY transitions are recomputed whenever the
 * booking set changes (see TripsService.recomputeStatus).
 */
@Injectable()
export class TripStateMachine {
  /** Whether the trip is at (or above) its go/no-go seat threshold. */
  hasMinReached(
    ctx: Pick<TripStateContext, 'confirmedSeats' | 'minPassengers'>,
  ): boolean {
    return ctx.confirmedSeats >= ctx.minPassengers;
  }

  /** Whether every offered seat is taken. */
  isFull(
    ctx: Pick<TripStateContext, 'confirmedSeats' | 'maxPassengers'>,
  ): boolean {
    return ctx.confirmedSeats >= ctx.maxPassengers;
  }

  /** The driver may edit only while the trip is still OPEN. */
  assertEditable(status: TripStatus): void {
    if (status !== TripStatus.Open) {
      throw new ConflictException(
        'Only OPEN trips can be edited; the trip is already committed',
      );
    }
  }

  /** The driver may cancel a trip that has not completed its lifecycle. */
  assertCancellable(status: TripStatus): void {
    if (status === TripStatus.Completed || status === TripStatus.Cancelled) {
      throw new ConflictException(
        'The trip is already finished and cannot be cancelled',
      );
    }
  }

  /**
   * Asserts the driver is allowed to confirm (READY → CONFIRMED) now.
   * The trip must be READY, i.e. the minimum seat count has been reached.
   */
  assertConfirmable(ctx: TripStateContext): void {
    if (ctx.status !== TripStatus.Ready) {
      throw new ConflictException(
        'Only READY trips (minimum reached) can be confirmed',
      );
    }
  }

  /**
   * Derives the status a capacity-relevant change should produce. Only the
   * OPEN/FULL/READY band is recomputed here; CONFIRMED/COMPLETED/CANCELLED are
   * terminal for the purpose of booking-driven recomputation.
   */
  deriveStatus(ctx: TripStateContext): TripStatus {
    switch (ctx.status) {
      case TripStatus.Open:
      case TripStatus.Full:
      case TripStatus.Ready:
        if (this.isFull(ctx)) {
          return TripStatus.Full;
        }
        if (this.hasMinReached(ctx)) {
          return TripStatus.Ready;
        }
        return TripStatus.Open;
      default:
        return ctx.status;
    }
  }
}
